# Baseline Testing — Before Change (TARS)

**Progetto**: TARS — Extension for Visual Studio Code  
**Corso**: Ingegneria del Software — Progetto Universitario  
**Repository**: [Sxlvo/tars](https://github.com/Sxlvo/tars)  
**Milestone**: M1 — Reverse Engineering & Baseline  
**Commit di riferimento**: `79daf1f` (*docs: simplify UML architecture diagrams*)  
**Autori**: Salvo Lepore (CR1), Salvador Davide Passarelli (CR2)  
**Data esecuzione**: 18 Ottobre 2026  

---

## 1. Obiettivo e Metodologia

Il presente documento definisce la **baseline di verifica del sistema software TARS prima dell'applicazione delle Change Request** (CR1: *Refactoring LLM Architecture*, CR2: *Support for Local Open-Weight LLMs*).

L'obiettivo è duplice:
1. Registrare con precisione il comportamento effettivo del software originale, identificando funzionalità operative, difetti latenti, incongruenze di configurazione e limiti strutturali.
2. Fornire una base di confronto solida e riproducibile per i test di regressione post-modifica (*After Change*), garantendo la non-regressione delle funzionalità preesistenti.

### Criteri di Valutazione degli Stati dei Test
- **`PASS`**: Il test è stato eseguito e il risultato effettivo coincide con il risultato atteso nel sistema originale.
- **`FAIL`**: Il test è stato eseguito e ha riscontrato un fallimento o un'anomalia rispetto alle aspettative funzionali/di qualità del software originale.
- **`BLOCKED`**: Il test non può essere eseguito per mancanza di precondizioni esterne indipendenti dal codice (es. assenza di credenziali a pagamento per servizi cloud).

> [!NOTE]
> Per garantire la massima integrità metodologica, i test che richiedono risorse a pagamento non disponibili sono dichiarati esplicitamente come `BLOCKED`, evitando l'invenzione o la falsificazione di risultati non verificati.

---

## 2. Matrice di Sintesi dei Test

| Categoria | Totale | PASS | FAIL | BLOCKED | Note Principali |
|---|:---:|:---:|:---:|:---:|---|
| **Ambiente & Compilazione (ENV)** | 3 | 2 | 1 | 0 | `npm run lint` fallisce perché include il bundle `dist/` |
| **Lifecycle & Comandi VS Code (VSC)** | 3 | 3 | 0 | 0 | Titolo `tars.explain-code` chiarito come `"Explain Code"` |
| **Configurazione LLM & Stato (CFG)** | 6 | 5 | 1 | 0 | Rilevata incongruenza latente su `llmType` (`"openai"` vs `"api"`) |
| **Theory of Mind (TOM)** | 3 | 3 | 0 | 0 | Webview questionario e persistenza `userMind` funzionanti |
| **Componenti Interni & Factory (INT)** | 8 | 8 | 0 | 0 | `LLMFactory` originale non supporta Ollama né structured output |
| **Esecuzione End-to-End (E2E)** | 2 | 1 | 1 | 0 | OpenAI cloud funzionante con GPT-4o; LLM locale non supportato |
| **TOTALE** | **25** | **22** | **3** | **0** | **Percentuale eseguiti: 100% (25/25)** |

---

## 3. Schede Dettagliate dei Test Case

### 3.1 Ambiente, Dipendenze e Compilazione (TC-ENV)

#### TC-ENV-01: Installazione delle dipendenze del progetto
- **Obiettivo**: Verificare l'integrità e la riproducibilità dell'installazione delle dipendenze dichiarate in `package.json` e `package-lock.json`.
- **Precondizioni**: Node.js v20.x/v24.x, npm attivo, repository clonato.
- **Procedura**: Eseguire da terminale `npm ci`.
- **Risultato Atteso**: Terminazione con codice di uscita 0, creazione di `node_modules` senza conflitti di dipendenze.
- **Risultato Effettivo**: 422 pacchetti installati correttamente in `node_modules` senza errori.
- **Stato**: **`PASS`**

#### TC-ENV-02: Compilazione bundle estensione tramite esbuild
- **Obiettivo**: Verificare che lo script di bundling compili i sorgenti JavaScript in `dist/extension.js`.
- **Precondizioni**: Dipendenze installate (`node_modules` presente).
- **Procedura**: Eseguire da terminale `npm run compile`.
- **Risultato Atteso**: Creazione/aggiornamento del file `dist/extension.js` con codice di uscita 0.
- **Risultato Effettivo**: Bundle generato con successo (`[watch] build started ... build finished`, exit code 0).
- **Stato**: **`PASS`**

#### TC-ENV-03: Analisi statica del codice (Linter ESLint)
- **Obiettivo**: Verificare che la suite di linting originale passi senza errori bloccanti prima delle modifiche.
- **Precondizioni**: Bundle `dist/extension.js` compilato.
- **Procedura**: Eseguire `npm run lint` (che esegue `eslint .`).
- **Risultato Atteso**: Nessun errore bloccante di linting.
- **Risultato Effettivo**: **1011 problemi (119 errori, 892 warning)**.
  - *Causa*: Il file `eslint.config.mjs` originale specifica `files: ["**/*.js"]` ma omette la cartella `dist/` dalla lista degli ignorati (`ignores`). ESLint analizza il bundle minificato generato da esbuild (~150.000 righe) rilevando errori per variabili globali del browser (`document`, `navigator`, `XMLHttpRequest`).
  - *Nota*: Eseguendo l'analisi selettiva sui soli sorgenti `src/` (`npx eslint src/`), si ottengono **0 errori e 19 warning** (dovuti a variabili e funzioni non collegate nel codice originale, es. `critiqueNode`, `initializeOllamaModel`, `isCritiqueOK`).
- **Stato**: **`FAIL`** (difetto di configurazione preesistente nel progetto originale)

---

### 3.2 Registrazione Comandi e Ciclo di Vita VS Code (TC-VSC)

#### TC-VSC-01: Caricamento estensione nell'Extension Development Host
- **Obiettivo**: Verificare l'avvio e l'attivazione dell'estensione in una sessione di sviluppo VS Code.
- **Precondizioni**: VS Code installato, configurazione di debug `.vscode/launch.json` presente.
- **Procedura**: Premere `F5` in VS Code o avviare l'Extension Development Host.
- **Risultato Atteso**: Apertura della finestra di test di VS Code, estensione attivata tramite la funzione `activate(context)` in `extension.js`.
- **Risultato Effettivo**: La finestra host si apre regolarmente e tutti i comandi vengono registrati nelle sottoscrizioni del contesto (`context.subscriptions`).
- **Stato**: **`PASS`**

#### TC-VSC-02: Corrispondenza comandi package.json vs extension.js
- **Obiettivo**: Verificare che ogni comando dichiarato nel manifesto `package.json` corrisponda a un comando registrato in `extension.js`.
- **Precondizioni**: Ispezione statica di `package.json` (linee 21-70) e `extension.js` (linee 16-39).
- **Procedura**: Confronto dell'elenco dei comandi:
  - `tars.flushDB`, `tars.retrieve`, `tars.index-project`, `tars.toggle-decorations`, `tars.help-command`, `tars.show-tars-config`, `tars.configure-tars`, `tars.flush-tars-config`, `tars.explain-code`, `tars.flush`, `tars.tom`, `tars.logUserMind`.
- **Risultato Atteso**: 12 comandi dichiarati e 12 comandi registrati.
- **Risultato Effettivo**: Corrispondenza biunivoca perfetta per tutti i 12 identificativi.
- **Stato**: **`PASS`**

#### TC-VSC-03: Visibilità comando spiegazione (`tars.explain-code`) nella Command Palette
- **Obiettivo**: Verificare la reperibilità del comando di spiegazione nella Command Palette.
- **Precondizioni**: Extension Development Host attivo.
- **Procedura**:
  1. Aprire la Command Palette (`Cmd+Shift+P` su macOS / `Ctrl+Shift+P` su Windows/Linux).
  2. Digitare `> TARS`.
  3. Digitare `> Explain Code`.
- **Risultato Atteso**:
  - Con `> TARS`: il comando non viene mostrato perché il titolo dichiarato è `"Explain Code"` (senza prefisso "Tars").
  - Con `> Explain Code`: il comando compare ed è eseguibile.
- **Risultato Effettivo**: Confermato. Il titolo in `package.json` (linea 56) è `"Explain Code"`. Digitando `"Explain Code"` il comando compare immediatamente.
- **Stato**: **`PASS`** (anomalia di usabilità individuata e chiarita)

---

### 3.3 Configurazione LLM e Persistenza Stato (TC-CFG)

#### TC-CFG-01: Apertura Webview di configurazione (`tars.configure-tars`)
- **Obiettivo**: Verificare l'apertura e il corretto rendering dell'interfaccia HTML di configurazione.
- **Precondizioni**: Estensione attiva.
- **Procedura**: Eseguire il comando `tars.configure-tars`.
- **Risultato Atteso**: Apertura del pannello Webview "TARS Configuration" contenente:
  - Dropdown con modelli OpenAI (`gpt-4o`, `gpt-4.1`, `gpt-4.1-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`).
  - Campo password per OpenAI API Key (`sk-...`).
  - Pulsante "Save configuration".
- **Risultato Effettivo**: Webview visualizzata correttamente con tutti gli elementi grafici conformi.
- **Stato**: **`PASS`**

#### TC-CFG-02: Validazione campo API Key obbligatorio
- **Obiettivo**: Verificare il blocco del salvataggio se il campo API Key è vuoto.
- **Precondizioni**: Webview di configurazione aperta.
- **Procedura**: Selezionare un modello, lasciare vuoto il campo API Key e cliccare su "Save configuration".
- **Risultato Atteso**: Comparsa dell'alert: `"Please insert your OpenAI API Key."` e nessun messaggio inviato al backend.
- **Risultato Effettivo**: Alert visualizzato; il flusso di salvataggio viene interrotto (linee 137-140 di `configureTarsCommand.js`).
- **Stato**: **`PASS`**

#### TC-CFG-03: Salvataggio configurazione in globalState
- **Obiettivo**: Verificare la memorizzazione dei parametri nella memoria globale dell'estensione.
- **Precondizioni**: Webview aperta, modello `gpt-4o`, API Key fittizia inserita (es. `sk-baseline-test`).
- **Procedura**: Cliccare su "Save configuration".
- **Risultato Atteso**: Comparsa della notifica informativa `"Configuration saved!"` e memorizzazione dell'oggetto:
  ```json
  {
    "llmName": "gpt-4o",
    "llmType": "openai",
    "apiKey": "sk-baseline-test"
  }
  ```
- **Risultato Effettivo**: Notifica visualizzata e configurazione memorizzata in `context.globalState` con chiave `'tarsConfiguration'`.
- **Stato**: **`PASS`**

#### TC-CFG-04: Visualizzazione configurazione salvata (`tars.show-tars-config`)
- **Obiettivo**: Verificare la lettura e visualizzazione dei parametri memorizzati.
- **Precondizioni**: Configurazione salvata in precedenza.
- **Procedura**: Eseguire `tars.show-tars-config` da Command Palette.
- **Risultato Atteso**: Visualizzazione di una finestra modale con i dettagli di `llmName`, `llmType` e `apiKey`.
- **Risultato Effettivo**: Informazioni mostrate correttamente all'utente.
- **Stato**: **`PASS`**

#### TC-CFG-05: Reset configurazione (`tars.flush-tars-config`)
- **Obiettivo**: Verificare la cancellazione della configurazione da `globalState`.
- **Precondizioni**: Configurazione presente in memoria.
- **Procedura**: Eseguire `tars.flush-tars-config` da Command Palette.
- **Risultato Atteso**: Notifica `"Tars Configuration Flushed"`; la successiva invocazione di `tars.show-tars-config` segnala assenza di configurazione.
- **Risultato Effettivo**: Configurazione eliminata con successo (`update("tarsConfiguration", undefined)`).
- **Stato**: **`PASS`**

#### TC-CFG-06: Incongruenza logica su `llmType` tra Configurazione e Comando Spiegazione
- **Obiettivo**: Rilevare la discordanza di tipo tra quanto salvato dalla webview e quanto atteso dal flusso di spiegazione.
- **Precondizioni**: Analisi incrociata tra `configureTarsCommand.js` e `explainCodeCommand.js`.
- **Procedura**:
  1. In `configureTarsCommand.js` (linea 25): viene memorizzato rigidamente `llmType: "openai"`.
  2. In `explainCodeCommand.js` (linea 107): il codice esegue `llmType: llmType === "api" ? LLMType.OPENAI : LLMType.OLLAMA`.
- **Risultato Atteso**: La configurazione salvata dovrebbe produrre `LLMType.OPENAI`.
- **Risultato Effettivo**: Poiché `"openai" !== "api"`, l'operatore ternario restituisce **`LLMType.OLLAMA`**. Di conseguenza, allo stato dell'agente viene assegnato il tipo errato (`OllamaModel`).
  - *Impatto sul sistema originale*: Il bug non genera un errore visibile solo perché `planner()` in `agent.js` ignora completamente `state["llmType"]` e richiama direttamente `new ChatOpenAI()`.
  - *Impatto futuro*: Con il refactoring di CR1 (che userà la factory), questo bug causerebbe l'invocazione di `createLLM` con `OLLAMA` anziché `OPENAI`.
- **Stato**: **`FAIL`** (difetto architetturale latente accertato)

---

### 3.4 Theory of Mind (TC-TOM)

#### TC-TOM-01: Apertura questionario Theory of Mind (`tars.tom`)
- **Obiettivo**: Verificare l'apertura della webview del questionario ToM.
- **Precondizioni**: Estensione attiva.
- **Procedura**: Eseguire `tars.tom` da Command Palette.
- **Risultato Atteso**: Apertura della webview con le 7 domande previste per la profilazione dell'utente:
  1. Livello di esperienza di programmazione.
  2. Ruolo attuale.
  3. Scopo di utilizzo dell'estensione.
  4. Stile preferito di spiegazione.
  5. Linguaggi principalmente utilizzati.
  6. Obiettivo principale con l'estensione.
  7. Tono preferito dell'assistente.
- **Risultato Effettivo**: Webview renderizzata con tutte le domande e opzioni di scelta.
- **Stato**: **`PASS`**

#### TC-TOM-02: Salvataggio profilo Theory of Mind
- **Obiettivo**: Verificare la memorizzazione del profilo ToM in `globalState`.
- **Precondizioni**: Questionario ToM compilato.
- **Procedura**: Inviare le risposte cliccando su "Invia".
- **Risultato Atteso**: Notifica `"Quiz completato! Le tue risposte sono state salvate."` e persistenza dell'oggetto `userMind` in `context.globalState`.
- **Risultato Effettivo**: Profilo salvato correttamente come dizionario domanda-risposta.
- **Stato**: **`PASS`**

#### TC-TOM-03: Visualizzazione e cancellazione profilo ToM (`tars.logUserMind`, `tars.flush`)
- **Obiettivo**: Verificare la lettura e il reset dello stato mentale.
- **Precondizioni**: Profilo salvato.
- **Procedura**:
  1. Eseguire `tars.logUserMind`.
  2. Eseguire `tars.flush`.
- **Risultato Atteso**:
  - `logUserMind`: visualizza le risposte fornite nel questionario.
  - `flush`: resetta `userMind` a `undefined` con notifica `"Mental state flushed"`.
- **Risultato Effettivo**: Entrambe le operazioni eseguite con successo.
- **Stato**: **`PASS`**

---

### 3.5 Componenti Interni, Factory LLM e Grafo Agente (TC-INT)

I seguenti test sono supportati da test automatizzati riproducibili presenti in `test/baseline/baseline.test.js` ed eseguibili tramite `node --test test/baseline/baseline.test.js`.

#### TC-INT-01: Istanziazione provider OpenAI tramite `LLMFactory.createLLM`
- **Obiettivo**: Verificare che `LLMFactory` originale istanzi correttamente `ChatOpenAI` per `LLMType.OPENAI`.
- **Precondizioni**: Modulo `llmFactory.js` e dipendenza `@langchain/openai`.
- **Procedura**: Invocare `LLMFactory.createLLM(LLMType.OPENAI, "gpt-4o", "sk-test-key")`.
- **Risultato Atteso**: Oggetto restituito istanza di `ChatOpenAI` con `model: "gpt-4o"`, `temperature: 0`, `maxTokens: 10000`, `maxRetries: 5`.
- **Risultato Effettivo**: Istanza creata con tutti i parametri conformi.
- **Stato**: **`PASS`**

#### TC-INT-02: Istanziazione provider DeepSeek tramite `LLMFactory.createLLM`
- **Obiettivo**: Verificare che `LLMFactory` originale supporti `LLMType.DEEPSEEK` con `ChatOpenAI` e maxTokens 1000.
- **Precondizioni**: Modulo `llmFactory.js`.
- **Procedura**: Invocare `LLMFactory.createLLM(LLMType.DEEPSEEK, "deepseek-chat", "sk-test-key")`.
- **Risultato Atteso**: Oggetto `ChatOpenAI` con `model: "deepseek-chat"` e `maxTokens: 1000`.
- **Risultato Effettivo**: Istanza creata con successo e parametri verificati.
- **Stato**: **`PASS`**

#### TC-INT-03: Tentativo di istanziazione Ollama tramite `LLMFactory.createLLM` originale
- **Obiettivo**: Verificare il mancato supporto di Ollama nella factory originale.
- **Precondizioni**: Codice originale di `llmFactory.js`.
- **Procedura**: Invocare `LLMFactory.createLLM(LLMType.OLLAMA, "llama3", null)`.
- **Risultato Atteso**: Poiché le linee 11-12 di `llmFactory.js` sono commentate (`// case LLMType.OLLAMA:`), l'esecuzione deve ricadere nel `default` e lanciare errore.
- **Risultato Effettivo**: Sollevata eccezione `Error: "No valid LLM type provided."`.
- **Stato**: **`PASS`** (limite architetturale originale verificato)

#### TC-INT-04: Gestione tipo LLM non supportato in `LLMFactory.createLLM`
- **Obiettivo**: Verificare che tipi non riconosciuti sollevino eccezione controllata.
- **Precondizioni**: Modulo `llmFactory.js`.
- **Procedura**: Invocare `LLMFactory.createLLM("TIPO_NON_VALIDO", "modello", null)`.
- **Risultato Atteso**: Rifiuto con eccezione `Error: "No valid LLM type provided."`.
- **Risultato Effettivo**: Eccezione sollevata come atteso.
- **Stato**: **`PASS`**

#### TC-INT-05: Verifica assenza supporto Structured Output nella Factory originale
- **Obiettivo**: Accertare se la factory originale consenta l'applicazione di schemi strutturati.
- **Precondizioni**: Ispezione dell'interfaccia di `LLMFactory.createLLM`.
- **Procedura**: Verificare la firma e il tipo di ritorno del metodo `createLLM(llmType, modelName, apiKey)`.
- **Risultato Atteso**: La factory originale non accetta parametri di schema Zod/JSON né applica `.withStructuredOutput()`.
- **Risultato Effettivo**: Confermato: la factory originale restituisce un modello non configurato per l'output strutturato. Nel planner (`agent.js`, linee 29-31) lo structured output è invocato direttamente sull'istanza `new ChatOpenAI()`.
- **Stato**: **`PASS`** (requisito chiave per CR1 e CR2 documentato)

#### TC-INT-06: Compilazione e topologia del grafo LangGraph (`agent`)
- **Obiettivo**: Verificare i nodi e gli archi registrati ed eseguiti nel grafo LangGraph originale.
- **Precondizioni**: Modulo `src/agent/agent.js`.
- **Procedura**: Invocare `agent.compile()` ed esaminare i nodi del grafo.
- **Risultato Atteso**: Grafo compilato con esattamente due nodi attivi: `plannerNode` e `syntaxCheck`.
- **Risultato Effettivo**: Grafo compilato con successo. I nodi presenti sono `plannerNode` e `syntaxCheck`. I nodi `critiqueNode`, `isCritiqueOK` e `isSyntaxOK` risultano commentati nel codice sorgente e non attivi nel runtime.
- **Stato**: **`PASS`**

#### TC-INT-07: Verifica delle funzioni di utilità dell'agente (`agentUtils.js`)
- **Obiettivo**: Verificare le funzioni pure di supporto al prompt e al post-processing:
  - `doubleBraces`: raddoppio parentesi graffe per templating LangChain.
  - `cleanLLMAnswer`: pulizia dei delimitatori Markdown (```` ```json ````) e rimozione dei blocchi di reasoning DeepSeek (`</think>\n`).
  - `extractUsedConstructs`: estrazione dei costrutti importati effettivamente usati nel codice da spiegare.
- **Precondizioni**: Modulo `src/agent/agentUtils.js`.
- **Procedura**: Esecuzione dei casi di test in `test/baseline/baseline.test.js`.
- **Risultato Atteso**: Trasformazioni di stringa e filtraggi conformi.
- **Risultato Effettivo**: Tutte le asserzioni superate con successo.
- **Stato**: **`PASS`**

#### TC-INT-08: Verifica del modulo Cache spiegazioni (`cache.js`)
- **Obiettivo**: Verificare il salvataggio e recupero in memoria e su file delle spiegazioni già generate.
- **Precondizioni**: Modulo `src/utils/cache.js`.
- **Procedura**: Salvare una spiegazione con `storeExplanation(codice + profilo, output)` e richiamarla con `getCachedExplanation`.
- **Risultato Atteso**: Corrispondenza biunivoca del dato basata sull'hash SHA-256 della chiave.
- **Risultato Effettivo**: Dati salvati e recuperati correttamente dalla mappa in memoria e dal file `src/utils/explanationCache.json`.
- **Stato**: **`PASS`**

---

### 3.6 Esecuzione End-to-End Spiegazione Codice (TC-E2E)

#### TC-E2E-01: Generazione spiegazione con OpenAI API reale (Cloud)
- **Obiettivo**: Verificare il percorso completo di spiegazione del codice: invocazione comando $\rightarrow$ estrazione costrutti $\rightarrow$ prompt con Theory of Mind $\rightarrow$ generazione tramite `ChatOpenAI` con structured output $\rightarrow$ validazione sintattica (`syntaxCheckNode`) $\rightarrow$ restituzione ed elaborazione delle spiegazioni.
- **Precondizioni**: API Key OpenAI valida e con credito attivo configurata (`sk-proj-...`), modello di riferimento `gpt-4o`.
- **Procedura**: Esecuzione del test end-to-end (tramite script automatizzato `test/baseline/e2e_openai.test.js` e/o Extension Development Host con comando `Explain Code`).
- **Risultato Atteso**: Il modello restituisce la lista strutturata conforme allo schema Zod (`results: [{text, description}]`); il nodo `syntaxCheckNode` valida con successo il JSON restituendo `syntaxCheckMessage: "OK"` e la lista dei blocchi spiegati.
- **Risultato Effettivo**: **Verificato con successo**. Chiamata reale a OpenAI API con modello `gpt-4o` completata. Ricevuta la risposta strutturata contenente i cluster di codice con le relative spiegazioni calibrate sul profilo Theory of Mind. Il validatore `syntaxCheckNode` ha analizzato e formattato la risposta con esito `syntaxCheckMessage: "OK"`.
- **Stato**: **`PASS`**

#### TC-E2E-02: Generazione spiegazione con LLM Locale (Ollama / LM Studio) originale
- **Obiettivo**: Verificare se il sistema originale consente l'esecuzione di spiegazioni con modelli locali open-weight su endpoint OpenAI-compatible o Ollama.
- **Precondizioni**: Server locale (Ollama o LM Studio) attivo sulla porta standard (`http://localhost:11434` o `http://localhost:1234`).
- **Procedura**: Tentare di configurare ed eseguire TARS originale con un modello locale.
- **Risultato Atteso**: La configurazione e l'esecuzione non sono possibili nel sistema originale:
  - La webview consente di scegliere solo modelli OpenAI hardcoded e impedisce il salvataggio senza chiave API.
  - Il planner istanzia direttamente `ChatOpenAI` senza parametro `baseURL` configurabile dall'utente.
  - La factory originale ha il codice Ollama commentato e non gestisce endpoint personalizzati.
- **Risultato Effettivo**: **Non supportato**. Il sistema originale è strettamente vincolato al servizio cloud proprietario OpenAI.
- **Stato**: **`FAIL (Funzionalità assente — Oggetto della CR2)`**

---

## 4. Conclusioni e Raccomandazioni per CR1 e CR2

Dall'analisi sistematica del Baseline Testing emergono evidenze decisive che guidano le prossime fasi di progetto:

1. **Risoluzione della discrepanza di naming**:
   Il comando `tars.explain-code` possiede titolo `"Explain Code"` in `package.json`. Nei test e nella documentazione per gli utenti occorre fare riferimento al titolo effettivo o valutare l'aggiornamento a `"TARS: Explain Code"`.

2. **Correzione dell'incongruenza `llmType` (Responsabilità CR1)**:
   La discrepanza tra `llmType: "openai"` (salvato da `configureTarsCommand.js`) e `llmType === "api"` (letto da `explainCodeCommand.js`) produce `LLMType.OLLAMA`. Questo difetto deve essere obbligatoriamente sanato nella CR1 prima di delegare la creazione del modello alla factory.

3. **Integrazione dello Structured Output nella Factory (Interfaccia CR1 / CR2)**:
   Nel sistema originale `.withStructuredOutput(schema, { strict: true })` è invocato direttamente su `ChatOpenAI` nel planner. Per consentire alla CR1 di centralizzare la creazione del modello e alla CR2 di supportare server locali (dove lo structured output richiede modalità flessibili come JSON Mode, tool calling o JSON Schema standard), `LLMFactory` deve essere estesa per supportare configurazioni di output strutturato.

4. **Configurazione flessibile per modelli locali (Responsabilità CR2)**:
   La webview di configurazione deve evolvere per supportare:
   - Scelta del tipo di provider (OpenAI Cloud vs Local / OpenAI-compatible).
   - Inserimento libero di `endpointUrl` (es. `http://localhost:11434/v1` o `http://localhost:1234/v1`).
   - Inserimento libero di `modelName`.
   - API Key opzionale (non obbligatoria per server locali).

5. **Idoneità al passaggio alla Milestone M2**:
   Con il completamento del Baseline Testing e la formalizzazione dei limiti di partenza, la Milestone M1 può considerarsi verificata. È possibile procedere alla redazione del documento di **Impact Analysis per CR2** (`docs/change-requests/CR2-impact-analysis.md`).
