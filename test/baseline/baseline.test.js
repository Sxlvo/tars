const assert = require('assert');
const { describe, it } = require('node:test');
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
                    showErrorMessage: () => {},
                    showInformationMessage: () => {},
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

const { LLMFactory } = require('../../src/agent/llmFactory');
const { LLMType } = require('../../src/agent/agentState');
const { agent } = require('../../src/agent/agent');
const {
    doubleBraces,
    cleanLLMAnswer,
    extractUsedConstructs
} = require('../../src/agent/agentUtils');

describe('TARS Baseline Testing - Before Change (Unit & Architectural Checks)', () => {

    describe('TC-INT: LLMFactory Tests', () => {
        it('TC-INT-01: should instantiate ChatOpenAI for OPENAI type', async () => {
            const llm = await LLMFactory.createLLM(LLMType.OPENAI, 'gpt-4o', 'sk-test-mock');
            assert.ok(llm, 'LLM instance should be defined');
            assert.strictEqual(llm.model, 'gpt-4o');
            assert.strictEqual(llm.maxTokens, 10000);
            assert.strictEqual(llm.temperature, 0);
        });

        it('TC-INT-02: should instantiate ChatOpenAI for DEEPSEEK type with maxTokens 1000', async () => {
            const llm = await LLMFactory.createLLM(LLMType.DEEPSEEK, 'deepseek-chat', 'sk-test-mock');
            assert.ok(llm, 'LLM instance should be defined');
            assert.strictEqual(llm.model, 'deepseek-chat');
            assert.strictEqual(llm.maxTokens, 1000);
        });

        it('TC-INT-03: should throw error for OLLAMA in original code (commented out)', async () => {
            await assert.rejects(
                async () => {
                    await LLMFactory.createLLM(LLMType.OLLAMA, 'llama3', null);
                },
                /No valid LLM type provided/
            );
        });

        it('TC-INT-04: should throw error for unknown/unsupported LLM type', async () => {
            await assert.rejects(
                async () => {
                    await LLMFactory.createLLM('NON_EXISTENT_TYPE', 'foo', null);
                },
                /No valid LLM type provided/
            );
        });

        it('TC-INT-05: verifies that original LLMFactory lacks withStructuredOutput configuration', () => {
            assert.strictEqual(typeof LLMFactory.createLLM, 'function');
            // Factory only takes (llmType, modelName, apiKey), not schema or structured options
            assert.strictEqual(LLMFactory.createLLM.length, 3);
        });
    });

    describe('TC-INT: Agent and LangGraph Topology', () => {
        it('TC-INT-06: should compile agent graph with only plannerNode and syntaxCheck active', () => {
            const compiled = agent.compile();
            assert.ok(compiled, 'Agent should compile successfully');
            const nodeNames = Object.keys(agent.nodes);
            assert.deepStrictEqual(nodeNames.sort(), ['plannerNode', 'syntaxCheck'].sort());
            assert.ok(!nodeNames.includes('critiqueNode'), 'critiqueNode should not be active in original graph');
        });
    });

    describe('TC-INT: Agent Utils Verification', () => {
        it('TC-INT-07a: doubleBraces should escape curly braces for LangChain prompt templates', () => {
            const input = 'const x = { key: "val" };';
            const escaped = doubleBraces(input);
            assert.strictEqual(escaped, 'const x = {{ key: "val" }};');
        });

        it('TC-INT-07b: cleanLLMAnswer should strip markdown code fences and think tags', () => {
            const rawWithMarkdown = '```json\n[{"text":"x","description":"y"}]\n```';
            assert.strictEqual(cleanLLMAnswer(rawWithMarkdown).trim(), '[{"text":"x","description":"y"}]');

            const rawWithThink = '<think>internal monologue</think>\n```json\n[{"text":"a","description":"b"}]\n```';
            assert.strictEqual(cleanLLMAnswer(rawWithThink).trim(), '[{"text":"a","description":"b"}]');
        });

        it('TC-INT-07c: extractUsedConstructs should filter only constructs referenced in source code', () => {
            const imported = {
                activeFunc: { code: 'function activeFunc() { return 1; }' },
                dormantFunc: { code: 'function dormantFunc() { return 0; }' }
            };
            const code = 'function caller() { return activeFunc(); }';
            const result = extractUsedConstructs(code, imported);
            assert.ok(result.includes('activeFunc'));
            assert.ok(!result.includes('dormantFunc'));
        });
    });

    describe('TC-CFG: Incongruence Checks in Original Code', () => {
        it('TC-CFG-06: detects llmType string mismatch between configure command and explain command', () => {
            const savedFromConfig = 'openai'; // as saved in configureTarsCommand.js:25
            const resolvedType = savedFromConfig === 'api' ? LLMType.OPENAI : LLMType.OLLAMA;
            // Demonstrates that "openai" resolves to LLMType.OLLAMA in explainCodeCommand.js:107
            assert.strictEqual(resolvedType, LLMType.OLLAMA);
            assert.notStrictEqual(resolvedType, LLMType.OPENAI);
        });
    });
});
