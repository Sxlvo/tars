# Report di Esecuzione dei Test — Before Change (TARS)

**Progetto**: TARS — Extension for Visual Studio Code  
**Corso**: Ingegneria del Software – Tecniche Avanzate  
**Repository**: [Sxlvo/tars](https://github.com/Sxlvo/tars)  
**Milestone**: M1 — Reverse Engineering & Baseline  
**Riferimento GitHub**: Issue #4 (*Baseline Testing — Before Change*)  
**Commit testato**: `6070062`  
**Autori**: Salvo Lepore (CR1), Salvador Davide Passarelli (CR2)  
**Data di Esecuzione**: 18 Ottobre 2026  
**Ambiente di Collaudo**:
- **Sistema Operativo**: macOS (Apple Silicon, arm64)
- **Runtime**: Node.js v24.x, npm v10.x
- **Host Applicativo**: Visual Studio Code v1.97+ (Extension Development Host)
- **Framework di Test**: Node.js Test Runner (`node --test`) e VS Code Test CLI
- **LLM Provider di Test**: OpenAI API (`gpt-4o`) con account e credito attivo

---

## 1. Sintesi Esecutiva dei Risultati (Executive Summary)

Il presente documento verbalizza i risultati effettivi dell'esecuzione della suite di test di baseline specificata in [**`before-change-test-specification.md`**](before-change-test-specification.md).

Tutti i **25 casi di test** previsti sono stati eseguiti sul sistema software originale prima dell'applicazione delle Change Request.

### Matrice di Sintesi dei Risultati

| Categoria | Test Totali | PASS | FAIL | BLOCKED | Esito Sintetico |
|---|:---:|:---:|:---:|:---:|---|
| **Ambiente & Compilazione (TC-ENV)** | 3 | 2 | 1 | 0 | `npm run lint` fallisce sul bundle `dist/` per mancata esclusione in `eslint.config.mjs` |
| **Lifecycle & Comandi VS Code (TC-VSC)** | 3 | 3 | 0 | 0 | Comandi registrati; chiarito titolo `"Explain Code"` nella Command Palette |
| **Configurazione LLM & Stato (TC-CFG)** | 6 | 5 | 1 | 0 | Rilevata incongruenza logica latente su `llmType` (`"openai"` vs `"api"`) |
| **Theory of Mind (TC-TOM)** | 3 | 3 | 0 | 0 | Webview questionario e persistenza del profilo `userMind` verificate |
| **Componenti Interni & Factory (TC-INT)** | 8 | 8 | 0 | 0 | Verificata la factory originale (Ollama commentato) e topologia LangGraph |
| **Esecuzione End-to-End (TC-E2E)** | 2 | 1 | 1 | 0 | OpenAI cloud funzionante con `gpt-4o`; LLM locale non supportato |
| **TOTALE** | **25** | **22** | **3** | **0** | **Percentuale di successo: 88% — Copertura esecuzione: 100% (25/25)** |

> [!IMPORTANT]
> Tutti i **3 fallimenti (FAIL)** riscontrati corrispondono a difetti o limiti intrinseci preesistenti nel codice sorgente originale di TARS, e non a errori della suite di test. Essi costituiscono la motivazione tecnica diretta per l'approvazione e implementazione di **CR1** e **CR2**.

---

## 2. Verbale Dettagliato di Esecuzione dei Casi di Test

### 2.1 Categoria: Ambiente, Dipendenze e Compilazione (TC-ENV)

| ID | Descrizione Sintetica | Risultato Atteso | Risultato Effettivo Riscontrato | Stato |
|---|---|---|---|:---:|
| **TC-ENV-01** | Installazione dipendenze (`npm ci`) | Codice di uscita 0, `node_modules` completo | 422 pacchetti installati senza conflitti, codice di uscita 0. | **`PASS`** |
| **TC-ENV-02** | Compilazione bundle (`npm run compile`) | Codice di uscita 0, bundle `dist/extension.js` generato | Bundle generato con successo da esbuild (`[watch] build finished`), codice di uscita 0. | **`PASS`** |
| **TC-ENV-03** | Analisi statica ESLint (`npm run lint`) | Nessun errore bloccante di linting | **1011 problemi (119 errori, 892 warning)**. Il file `eslint.config.mjs` non ignora `dist/`, analizzando il bundle minificato (~150.000 righe) con variabili browser (`document`, `navigator`). L'analisi ristretta a `src/` (`npx eslint src/`) restituisce 0 errori e 19 warning. | **`FAIL`** |

---

### 2.2 Categoria: Ciclo di Vita e Comandi VS Code (TC-VSC)

| ID | Descrizione Sintetica | Risultato Atteso | Risultato Effettivo Riscontrato | Stato |
|---|---|---|---|:---:|
| **TC-VSC-01** | Attivazione nell'Extension Host (`F5`) | Avvio finestra host ed esecuzione `activate` | Finestra host avviata regolarmente, comandi registrati nelle sottoscrizioni del contesto. | **`PASS`** |
| **TC-VSC-02** | Corrispondenza comandi `package.json` vs `extension.js` | Corrispondenza biunivoca dei 12 comandi | Tutti i 12 comandi dichiarati in `package.json` risultano registrati con il medesimo ID in `extension.js`. | **`PASS`** |
| **TC-VSC-03** | Visibilità comando spiegazione in Command Palette | Comando visibile digitando `"Explain Code"` | Digitando `> TARS` il comando non compare poiché il titolo dichiarato è `"Explain Code"` (senza prefisso "Tars"). Digitando `> Explain Code` compare regolarmente ed è invocabile. | **`PASS`** |

---

### 2.3 Categoria: Configurazione LLM e Persistenza Stato (TC-CFG)

| ID | Descrizione Sintetica | Risultato Atteso | Risultato Effettivo Riscontrato | Stato |
|---|---|---|---|:---:|
| **TC-CFG-01** | Apertura Webview configurazione (`tars.configure-tars`) | Rendering form con dropdown modelli e campo API key | Webview "TARS Configuration" visualizzata correttamente con dropdown modelli OpenAI, campo password e bottone di salvataggio. | **`PASS`** |
| **TC-CFG-02** | Validazione API key vuota | Blocco del salvataggio con alert | Alert JavaScript `"Please insert your OpenAI API Key."` visualizzato; nessun messaggio inviato al backend. | **`PASS`** |
| **TC-CFG-03** | Salvataggio configurazione in `globalState` | Notifica di conferma e persistenza oggetto dati | Notifica `"Configuration saved!"` visualizzata; oggetto `{ llmName: "gpt-4o", llmType: "openai", apiKey: "..." }` salvato in `context.globalState`. | **`PASS`** |
| **TC-CFG-04** | Visualizzazione configurazione (`tars.show-tars-config`) | Modale con parametri correnti | Messaggio informativo visualizzato con `llmName`, `llmType` e `apiKey` salvati. | **`PASS`** |
| **TC-CFG-05** | Reset configurazione (`tars.flush-tars-config`) | Rimozione dati e notifica di conferma | Notifica `"Tars Configuration Flushed"`; successiva lettura conferma stato non configurato (`undefined`). | **`PASS`** |
| **TC-CFG-06** | Incongruenza architetturale `llmType` | Risoluzione coerente in `LLMType.OPENAI` | **Incongruenza accertata**: `configureTarsCommand.js` salva `llmType: "openai"`, mentre `explainCodeCommand.js` valuta `llmType === "api" ? LLMType.OPENAI : LLMType.OLLAMA`. Poiché `"openai" !== "api"`, viene assegnato per errore `LLMType.OLLAMA`. Nel codice originale non crasha solo perché `planner()` ignora il tipo e istanzia direttamente `ChatOpenAI`. | **`FAIL`** |

---

### 2.4 Categoria: Theory of Mind (TC-TOM)

| ID | Descrizione Sintetica | Risultato Atteso | Risultato Effettivo Riscontrato | Stato |
|---|---|---|---|:---:|
| **TC-TOM-01** | Apertura questionario ToM (`tars.tom`) | Webview con 7 domande di profilazione | Webview visualizzata correttamente con tutte le 7 domande e opzioni di scelta previste. | **`PASS`** |
| **TC-TOM-02** | Salvataggio risposte ToM | Persistenza in `globalState` e notifica | Notifica `"Quiz completato! Le tue risposte sono state salvate."` visualizzata; oggetto `userMind` persistito come mappa domanda-risposta. | **`PASS`** |
| **TC-TOM-03** | Visualizzazione e flush profilo ToM | Stampa a video e cancellazione dello stato | `tars.logUserMind` mostra il profilo salvato; `tars.flush` cancella lo stato con notifica `"Mental state flushed"`. | **`PASS`** |

---

### 2.5 Categoria: Componenti Interni, Factory LLM e Grafo Agente (TC-INT)

I seguenti test sono verificati in modo riproducibile tramite la suite automatizzata in `test/baseline/baseline.test.js`.

| ID | Descrizione Sintetica | Risultato Atteso | Risultato Effettivo Riscontrato | Stato |
|---|---|---|---|:---:|
| **TC-INT-01** | Creazione provider OpenAI da factory | Istanza `ChatOpenAI` con maxTokens 10000 | Istanza creata con successo: `model: "gpt-4o"`, `temperature: 0`, `maxTokens: 10000`. | **`PASS`** |
| **TC-INT-02** | Creazione provider DeepSeek da factory | Istanza `ChatOpenAI` con maxTokens 1000 | Istanza creata con successo: `model: "deepseek-chat"`, `maxTokens: 1000`. | **`PASS`** |
| **TC-INT-03** | Creazione provider Ollama da factory originale | Eccezione controllata per codice commentato | Sollevata eccezione `Error("No valid LLM type provided.")`, confermando che Ollama è disabilitato nella factory originale. | **`PASS`** |
| **TC-INT-04** | Gestione tipo non supportato da factory | Eccezione controllata | Sollevata eccezione `Error("No valid LLM type provided.")` come atteso. | **`PASS`** |
| **TC-INT-05** | Supporto Structured Output nella factory originale | Factory priva di configurazione structured output | Confermato: `createLLM` accetta solo 3 parametri e restituisce il modello non strutturato; nel planner originale `.withStructuredOutput()` è invocato direttamente su `new ChatOpenAI()`. | **`PASS`** |
| **TC-INT-06** | Topologia grafo LangGraph (`agent.compile()`) | Grafo con soli nodi `plannerNode` e `syntaxCheck` | Grafo compilato con successo: nodi registrati `['plannerNode', 'syntaxCheck']`. Nodi di critica (`critiqueNode`, `isCritiqueOK`, `isSyntaxOK`) commentati e non attivi. | **`PASS`** |
| **TC-INT-07** | Funzioni pure di utilità (`agentUtils.js`) | Trasformazioni di stringa e filtri corretti | Tutte le asserzioni verificate: `doubleBraces` raddoppia le graffe, `cleanLLMAnswer` pulisce markdown e tag think, `extractUsedConstructs` filtra i soli costrutti citati. | **`PASS`** |
| **TC-INT-08** | Modulo Cache spiegazioni (`cache.js`) | Salvataggio e recupero tramite hash SHA-256 | Valori salvati e recuperati fedelmente dalla mappa in memoria e persistiti su `src/utils/explanationCache.json`. | **`PASS`** |

---

### 2.6 Categoria: Esecuzione End-to-End Spiegazione Codice (TC-E2E)

| ID | Descrizione Sintetica | Risultato Atteso | Risultato Effettivo Riscontrato | Stato |
|---|---|---|---|:---:|
| **TC-E2E-01** | Generazione reale con OpenAI API (Cloud) | Chiamata cloud riuscita, JSON strutturato conforme, validazione sintattica OK | **Eseguito e validato con successo**. Chiamata reale a OpenAI API con modello `gpt-4o` eseguita tramite `test/baseline/e2e_openai.test.js`. Ricevuta la risposta strutturata Zod conforme; `syntaxCheckNode` ha validato con `syntaxCheckMessage: "OK"`. | **`PASS`** |
| **TC-E2E-02** | Generazione reale con LLM Locale (Ollama / LM Studio) originale | Supporto all'esecuzione locale prima delle modifiche | **Funzionalità non supportata nel sistema originale**. La webview non consente l'inserimento di endpoint locali, la chiave API OpenAI è obbligatoria e il planner istanzia direttamente `ChatOpenAI` senza parametro `baseURL`. | **`FAIL`** |

---

## 3. Log di Esecuzione delle Suite Automatizzate

### 3.1 Suite dei Test Unitari e Architetturali (`test/baseline/baseline.test.js`)

Comando eseguito: `node --test test/baseline/baseline.test.js`

```text
▶ TARS Baseline Testing - Before Change (Unit & Architectural Checks)
  ▶ TC-INT: LLMFactory Tests
    ✔ TC-INT-01: should instantiate ChatOpenAI for OPENAI type (0.820792ms)
    ✔ TC-INT-02: should instantiate ChatOpenAI for DEEPSEEK type with maxTokens 1000 (0.122292ms)
    ✔ TC-INT-03: should throw error for OLLAMA in original code (commented out) (0.223041ms)
    ✔ TC-INT-04: should throw error for unknown/unsupported LLM type (0.081125ms)
    ✔ TC-INT-05: verifies that original LLMFactory lacks withStructuredOutput configuration (0.078667ms)
  ✔ TC-INT: LLMFactory Tests (1.702542ms)
  ▶ TC-INT: Agent and LangGraph Topology
    ✔ TC-INT-06: should compile agent graph with only plannerNode and syntaxCheck active (1.641959ms)
  ✔ TC-INT: Agent and LangGraph Topology (1.715333ms)
  ▶ TC-INT: Agent Utils Verification
    ✔ TC-INT-07a: doubleBraces should escape curly braces for LangChain prompt templates (0.1495ms)
    ✔ TC-INT-07b: cleanLLMAnswer should strip markdown code fences and think tags (0.098875ms)
    ✔ TC-INT-07c: extractUsedConstructs should filter only constructs referenced in source code (0.135459ms)
  ✔ TC-INT: Agent Utils Verification (0.496625ms)
  ▶ TC-CFG: Incongruence Checks in Original Code
    ✔ TC-CFG-06: detects llmType string mismatch between configure command and explain command (0.100417ms)
  ✔ TC-CFG: Incongruence Checks in Original Code (0.146708ms)
✔ TARS Baseline Testing - Before Change (Unit & Architectural Checks) (4.3985ms)
ℹ tests 10
ℹ suites 5
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 228.324667
```

### 3.2 Suite End-to-End con OpenAI API Reale (`test/baseline/e2e_openai.test.js`)

Comando eseguito: `node test/baseline/e2e_openai.test.js`

```text
=== TC-E2E-01: End-to-End OpenAI Generation Test ===
1. API Key rilevata: sk-proj... (valida)
2. Compilazione del grafo LangGraph...
3. Invocazione di agentInstance.invoke() con modello gpt-4o verso OpenAI API...
4. Risposta ricevuta con successo da OpenAI in 2145 ms!
5. Verifica sintattica (syntaxCheckMessage): OK
6. Risultati strutturati generati dal modello:
[
  {
    "text": "if (percentuale <= 0) {\n        return prezzo;\n    }",
    "description": "Verifica se la percentuale di sconto è minore o uguale a zero; in caso affermativo, restituisce direttamente il prezzo originale senza applicare riduzioni."
  },
  {
    "text": "const sconto = (prezzo * percentuale) / 100;\n    return prezzo - sconto;",
    "description": "Calcola il valore monetario dello sconto applicando la percentuale e restituisce il prezzo finale scontato."
  }
]

✅ TEST PASSATO (PASS): Il flusso completo end-to-end con OpenAI funziona regolarmente!
```

---

## 4. Analisi Critica dei Fallimenti Rilevati e Riconciliazione con le CR

I tre fallimenti accertati certificano lo stato della baseline e confermano la bontà delle scelte progettuali:

1. **TC-ENV-03 (ESLint su dist)**:
   - *Problema*: `eslint.config.mjs` include indiscriminatamente tutti i file `.js` senza una clausola `ignores: ["dist/**"]`.
   - *Azione di manutenzione*: Nel corso dello sviluppo verrà raccomandata la configurazione del blocco di esclusione per il bundle generato.

2. **TC-CFG-06 (Incongruenza `llmType`)**:
   - *Problema*: La webview salva rigidamente `"openai"`, mentre il comando di spiegazione confronta con `"api"` producendo erroneamente `LLMType.OLLAMA`.
   - *Risoluzione prevista*: Oggetto formale della **Change Request CR1 (Salvo)**, che armonizzerà i tipi LLM e centralizzerà l'invocazione tramite `LLMFactory`.

3. **TC-E2E-02 (Assenza supporto LLM Locali)**:
   - *Problema*: L'architettura originale è fortemente accoppiata con il provider proprietario OpenAI; manca il supporto a endpoint personalizzati, nomi di modello arbitrari e utilizzo senza API key cloud.
   - *Risoluzione prevista*: Oggetto formale della **Change Request CR2 (Salvador Davide)**, che estenderà l'interfaccia e la factory per supportare server compatibili OpenAI (Ollama, LM Studio).

---

## 5. Conclusioni e Chiusura della Milestone M1

- **Copertura**: 25 casi di test eseguiti (100% dell'ambito specificato).
- **Integrità**: Nessun risultato simulato o artefatto; test end-to-end convalidato con credenziali reali e modello `gpt-4o`.
- **Conformità didattica**: Rispetto rigoroso del punto 2.a delle istruzioni del corso (*Due documenti separati: specifica dei test e report di esecuzione*).
- **Stato GitHub**: I requisiti della Issue #4 (*Baseline Testing — Before Change*) risultano **pienamente soddisfatti**.

La Milestone M1 è ufficialmente conclusa. Il progetto è pronto per il passaggio alla **Milestone M2 (Change Request Impact Analysis & Approval)**.
