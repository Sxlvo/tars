require('dotenv').config();
const assert = require('assert');
const Module = require('module');

// Mock vscode module if running in standalone Node.js environment
try {
    require('vscode');
} catch (e) {
    const origRequire = Module.prototype.require;
    Module.prototype.require = function (modulePath) {
        if (modulePath === 'vscode') {
            return {
                window: {
                    showErrorMessage: (msg) => console.error('[VSCode Error]', msg),
                    showInformationMessage: (msg) => console.log('[VSCode Info]', msg),
                    createTextEditorDecorationType: () => ({ dispose: () => {} }),
                    activeColorTheme: { kind: 1 },
                    ColorThemeKind: { Dark: 2, HighContrast: 3 }
                },
                Range: class { constructor(a, b, c, d) { Object.assign(this, { a, b, c, d }); } }
            };
        }
        return origRequire.apply(this, arguments);
    };
}

const { agent } = require('../../src/agent/agent');
const { LLMType } = require('../../src/agent/agentState');

async function runEndToEndOpenAITest() {
    console.log('=== TC-E2E-01: End-to-End OpenAI Generation Test ===');

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || !apiKey.startsWith('sk-')) {
        console.error('❌ ERRORE: Nessuna API Key valida trovata nel file .env (variabile OPENAI_API_KEY).');
        console.error('Assicurati di aver creato il file .env contenente: OPENAI_API_KEY=sk-proj-...');
        process.exit(1);
    }

    console.log('1. API Key rilevata:', apiKey.slice(0, 7) + '...' + apiKey.slice(-4));
    console.log('2. Compilazione del grafo LangGraph...');
    const agentInstance = agent.compile();

    const sampleCode = `
function calcolaSconto(prezzo, percentuale) {
    if (percentuale <= 0) {
        return prezzo;
    }
    const sconto = (prezzo * percentuale) / 100;
    return prezzo - sconto;
}
`.trim();

    const userProfileString = `User profile:
- experience: Intermediate
- role: Software Engineering Student
- purpose: Understanding code structure
- explanation style: Clear, conceptual
- languages: JavaScript
- goal: Learn software evolution
- tone: Professional`;

    console.log('3. Invocazione di agentInstance.invoke() con modello gpt-4o verso OpenAI API...');
    const startTime = Date.now();

    try {
        const response = await agentInstance.invoke({
            modelName: "gpt-4o",
            inputCode: sampleCode,
            llmType: LLMType.OPENAI,
            maxAttempts: 3,
            userProfile: userProfileString,
            llmAPI: apiKey,
            importedConstructs: {},
            documentationContext: ""
        });

        const elapsedMs = Date.now() - startTime;
        console.log(`4. Risposta ricevuta con successo da OpenAI in ${elapsedMs} ms!`);
        console.log('5. Verifica sintattica (syntaxCheckMessage):', response.syntaxCheckMessage);

        assert.strictEqual(response.syntaxCheckMessage, 'OK', 'syntaxCheckMessage deve essere OK');
        assert.ok(response.outputStructure, 'outputStructure deve essere definita');

        console.log('6. Risultati strutturati generati dal modello:');
        console.log(JSON.stringify(response.outputStructure, null, 2));

        console.log('\n✅ TEST PASSATO (PASS): Il flusso completo end-to-end con OpenAI funziona regolarmente!');
    } catch (err) {
        console.error('❌ ERRORE durante la chiamata a OpenAI:', err.message);
        if (err.status) console.error('HTTP Status:', err.status);
        process.exit(1);
    }
}

runEndToEndOpenAITest();
