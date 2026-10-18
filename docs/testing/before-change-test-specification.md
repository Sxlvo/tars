# Specifica dei Casi di Test — Before Change (TARS)

**Progetto**: TARS — Extension for Visual Studio Code  
**Corso**: Ingegneria del Software – Tecniche Avanzate  
**Repository**: [Sxlvo/tars](https://github.com/Sxlvo/tars)  
**Milestone**: M1 — Reverse Engineering & Baseline  
**Riferimento GitHub**: Issue #4 (*Baseline Testing — Before Change*)  
**Commit di riferimento**: `6070062`  
**Autori**: Salvo Lepore (CR1), Salvador Davide Passarelli (CR2)  
**Data**: 18 Ottobre 2026  

---

## 1. Introduzione e Obiettivo

Il presente documento definisce la **Specifica dei Casi di Test** per la baseline del sistema software TARS prima dell'applicazione degli interventi evolutivi previsti dalle Change Request (CR1: *Refactoring LLM Architecture*, CR2: *Support for Local Open-Weight LLMs*).

In conformità ai requisiti didattici del corso di *Ingegneria del Software – Tecniche Avanzate* (punto 2.a delle istruzioni di progetto), questo documento formalizza i casi di test definendo per ciascuno:
- **Identificativo univoco**: Codice alfanumerico strutturato per categoria.
- **Obiettivo**: Lo scopo della verifica e la proprietà software sotto osservazione.
- **Precondizioni**: Lo stato richiesto del sistema, dell'ambiente o delle dipendenze per l'avvio del test.
- **Procedura di esecuzione**: La sequenza dettagliata e deterministica di passi operativi.
- **Risultato atteso (Expected Result)**: Il comportamento, l'output o lo stato finale previsto in assenza di difetti.

I risultati effettivi e la verbalizzazione dell'esecuzione sono riportati nel documento complementare [**`before-change-test-execution.md`**](before-change-test-execution.md).

---

## 2. Strategia e Categorie di Test

La suite di test di baseline copre l'intero stack applicativo dell'estensione ed è articolata in sei categorie:

1. **TC-ENV (Ambiente, Dipendenze e Compilazione)**: Verifica la configurazione dell'ambiente di build, l'albero delle dipendenze e l'analisi statica del codice.
2. **TC-VSC (Ciclo di Vita e Registrazione Comandi VS Code)**: Verifica l'attivazione dell'estensione, il manifesto dei comandi e l'interazione con la Command Palette.
3. **TC-CFG (Configurazione LLM e Persistenza Stato)**: Verifica la Webview di configurazione, la validazione dei campi di input e la memorizzazione nello stato globale dell'estensione (`context.globalState`).
4. **TC-TOM (Theory of Mind)**: Verifica il questionario ToM, la cattura delle preferenze utente e i comandi di ispezione e reset del profilo.
5. **TC-INT (Componenti Interni, Factory LLM e Grafo Agente)**: Verifica unitaria ed architetturale di `LLMFactory`, della topologia di LangGraph e delle funzioni pure di utilità.
6. **TC-E2E (Esecuzione End-to-End Spiegazione Codice)**: Verifica funzionale dell'intero percorso di spiegazione del codice con modelli cloud proprietari e locali.

---

## 3. Specifiche Dettagliate dei Casi di Test

### 3.1 Categoria: Ambiente, Dipendenze e Compilazione (TC-ENV)

#### TC-ENV-01: Installazione pulita delle dipendenze del progetto
- **Categoria**: Ambiente & Build
- **Obiettivo**: Verificare l'integrità e la riproducibilità dell'installazione delle dipendenze dichiarate in `package.json` e `package-lock.json` su Node.js v20+.
- **Precondizioni**: Node.js e npm installati; connessione di rete attiva; cartella `node_modules` assente o pulita.
- **Procedura**:
  1. Aprire il terminale nella radice del progetto.
  2. Eseguire il comando: `npm ci`.
- **Risultato Atteso**: Il comando termina con codice di uscita 0 (`exit code 0`); tutti i pacchetti dichiarati vengono installati in `node_modules` senza conflitti né errori di risoluzione.

#### TC-ENV-02: Compilazione del bundle dell'estensione con esbuild
- **Categoria**: Ambiente & Build
- **Obiettivo**: Verificare che lo script di bundling compili i sorgenti JavaScript e produca il file distribuibile dell'estensione.
- **Precondizioni**: Dipendenze installate (`node_modules` presente).
- **Procedura**:
  1. Aprire il terminale nella radice del progetto.
  2. Eseguire il comando: `npm run compile`.
- **Risultato Atteso**: Creazione o aggiornamento del bundle `dist/extension.js` con codice di uscita 0; nessun errore di compilazione o bundling segnalato da esbuild.

#### TC-ENV-03: Analisi statica del codice sorgente tramite ESLint
- **Categoria**: Qualità del Codice
- **Obiettivo**: Verificare la conformità del codice sorgente alle regole di qualità e stile configurate nel progetto originale.
- **Precondizioni**: File di configurazione `eslint.config.mjs` presente; bundle `dist/extension.js` generato.
- **Procedura**:
  1. Aprire il terminale nella radice del progetto.
  2. Eseguire il comando: `npm run lint`.
- **Risultato Atteso**: Il linter analizza i file sorgenti applicativi (`src/`) e termina senza errori bloccanti (`0 errors`).

---

### 3.2 Categoria: Ciclo di Vita e Comandi VS Code (TC-VSC)

#### TC-VSC-01: Attivazione dell'estensione nell'Extension Development Host
- **Categoria**: Lifecycle VS Code
- **Obiettivo**: Verificare che l'estensione venga caricata dal runtime di VS Code ed esegua la funzione `activate(context)` senza generare eccezioni.
- **Precondizioni**: VS Code installato; bundle `dist/extension.js` compilato.
- **Procedura**:
  1. Aprire il progetto in VS Code.
  2. Premere il tasto `F5` (o selezionare *Run $\rightarrow$ Start Debugging*).
  3. Osservare l'avvio della finestra *[Extension Development Host]*.
- **Risultato Atteso**: La finestra dell'Extension Development Host si apre regolarmente; l'estensione si attiva senza errori visibili nella console di debug.

#### TC-VSC-02: Corrispondenza comandi dichiarati in package.json e registrati in extension.js
- **Categoria**: Configurazione Estensione
- **Obiettivo**: Verificare che tutti i comandi dichiarati nella sezione `contributes.commands` di `package.json` siano registrati nelle sottoscrizioni del contesto in `extension.js`.
- **Precondizioni**: File `package.json` ed `extension.js` disponibili.
- **Procedura**:
  1. Estrarre la lista degli identificativi dei comandi da `package.json`.
  2. Verificare che per ciascun identificativo esista una chiamata `vscode.commands.registerCommand(name, callback)` in `extension.js`.
- **Risultato Atteso**: Corrispondenza biunivoca perfetta per tutti i 12 comandi:
  `tars.flushDB`, `tars.retrieve`, `tars.index-project`, `tars.toggle-decorations`, `tars.help-command`, `tars.show-tars-config`, `tars.configure-tars`, `tars.flush-tars-config`, `tars.explain-code`, `tars.flush`, `tars.tom`, `tars.logUserMind`.

#### TC-VSC-03: Reperibilità del comando di spiegazione codice nella Command Palette
- **Categoria**: Interfaccia Utente VS Code
- **Obiettivo**: Verificare la visibilità e il titolo del comando `tars.explain-code` nella Command Palette di VS Code.
- **Precondizioni**: Extension Development Host attivo.
- **Procedura**:
  1. Nella finestra di test, aprire la Command Palette (`Cmd+Shift+P` su macOS / `Ctrl+Shift+P` su Windows/Linux).
  2. Digitare la query di ricerca `> TARS`.
  3. Digitare la query di ricerca `> Explain Code`.
- **Risultato Atteso**: Il comando è configurato con il titolo dichiarato in `package.json` (`"Explain Code"`); digitando `> Explain Code` compare ed è selezionabile.

---

### 3.3 Categoria: Configurazione LLM e Persistenza Stato (TC-CFG)

#### TC-CFG-01: Apertura Webview di configurazione del modello LLM
- **Categoria**: Interfaccia Webview
- **Obiettivo**: Verificare che il comando `tars.configure-tars` apra la webview con i campi previsti per la selezione del modello e della chiave API.
- **Precondizioni**: Estensione attiva nell'Extension Development Host.
- **Procedura**:
  1. Aprire la Command Palette ed eseguire `tars.configure-tars`.
  2. Verificare la struttura della Webview visualizzata nell'editor.
- **Risultato Atteso**: Apertura del pannello intitolato "TARS Configuration" contenente:
  - Menu a tendina (`select`) con id `llmName` e opzioni predefinite per OpenAI.
  - Campo di input password con id `apiKey` per l'inserimento della chiave.
  - Pulsante "Save configuration".

#### TC-CFG-02: Validazione obbligatorietà del campo API Key nella Webview
- **Categoria**: Validazione Input
- **Obiettivo**: Verificare che l'interfaccia impedisca il salvataggio della configurazione qualora il campo API Key sia vuoto.
- **Precondizioni**: Webview di configurazione aperta; campo API Key vuoto.
- **Procedura**:
  1. Selezionare un modello nel menu a tendina.
  2. Lasciare vuoto il campo API Key.
  3. Cliccare su "Save configuration".
- **Risultato Atteso**: Comparsa di un alert JavaScript con il messaggio `"Please insert your OpenAI API Key."`; nessun messaggio inviato al backend VS Code e nessuna scrittura dello stato.

#### TC-CFG-03: Salvataggio e persistenza della configurazione in context.globalState
- **Categoria**: Persistenza Dati
- **Obiettivo**: Verificare la corretta memorizzazione dei parametri di configurazione nella memoria globale dell'estensione.
- **Precondizioni**: Webview di configurazione aperta.
- **Procedura**:
  1. Selezionare il modello `gpt-4o`.
  2. Inserire una chiave API (es. `sk-test-mock`).
  3. Cliccare su "Save configuration".
- **Risultato Atteso**: Comparsa della notifica VS Code `"Configuration saved!"`; memorizzazione in `context.globalState` della chiave `'tarsConfiguration'` contenente l'oggetto `{ llmName: "gpt-4o", llmType: "openai", apiKey: "sk-test-mock" }`.

#### TC-CFG-04: Visualizzazione configurazione corrente tramite comando dedicato
- **Categoria**: Ispezione Stato
- **Obiettivo**: Verificare che il comando `tars.show-tars-config` visualizzi i parametri correnti salvati.
- **Precondizioni**: Configurazione precedentemente salvata in `globalState`.
- **Procedura**:
  1. Eseguire da Command Palette il comando `tars.show-tars-config`.
- **Risultato Atteso**: Comparsa di una finestra informativa VS Code contenente i dettagli correnti di `llmName`, `llmType` e `apiKey`.

#### TC-CFG-05: Reset della configurazione tramite comando flush
- **Categoria**: Gestione Stato
- **Obiettivo**: Verificare che il comando `tars.flush-tars-config` elimini la configurazione memorizzata.
- **Precondizioni**: Configurazione presente in `globalState`.
- **Procedura**:
  1. Eseguire da Command Palette il comando `tars.flush-tars-config`.
  2. Eseguire successivamente `tars.show-tars-config`.
- **Risultato Atteso**: Comparsa della notifica `"Tars Configuration Flushed"`; la successiva lettura della configurazione segnala che nessun parametro è presente.

#### TC-CFG-06: Verifica coerenza del tipo llmType tra scrittura e lettura
- **Categoria**: Coerenza Architetturale
- **Obiettivo**: Verificare che il valore salvato nel campo `llmType` da `configureTarsCommand.js` sia semanticamente coerente con il valore atteso da `explainCodeCommand.js`.
- **Precondizioni**: Analisi statica e unit test del flusso dati tra comandi.
- **Procedura**:
  1. Ispezionare il valore memorizzato in `configureTarsCommand.js` (linea 25: `llmType: "openai"`).
  2. Ispezionare la risoluzione in `explainCodeCommand.js` (linea 107: `llmType === "api" ? LLMType.OPENAI : LLMType.OLLAMA`).
- **Risultato Atteso**: Il valore salvato per OpenAI deve risolvere correttamente in `LLMType.OPENAI`.

---

### 3.4 Categoria: Theory of Mind (TC-TOM)

#### TC-TOM-01: Apertura ed emissione del questionario Theory of Mind
- **Categoria**: Interfaccia ToM
- **Obiettivo**: Verificare che il comando `tars.tom` apra la webview con il set completo di domande per la profilazione dell'utente.
- **Precondizioni**: Estensione attiva.
- **Procedura**:
  1. Eseguire da Command Palette il comando `tars.tom`.
  2. Verificare le domande presenti nel questionario.
- **Risultato Atteso**: Apertura del pannello Webview contenente le 7 domande di profilazione:
  esperienza, ruolo, scopo, stile di spiegazione, linguaggi principali, obiettivo e tono.

#### TC-TOM-02: Salvataggio del profilo utente ToM in context.globalState
- **Categoria**: Persistenza ToM
- **Obiettivo**: Verificare che l'invio delle risposte memorizzi l'oggetto profilo utente in `globalState`.
- **Precondizioni**: Questionario ToM aperto e compilato.
- **Procedura**:
  1. Selezionare una risposta per ciascuna domanda.
  2. Cliccare sul pulsante di invio del questionario.
- **Risultato Atteso**: Notifica `"Quiz completato! Le tue risposte sono state salvate."`; memorizzazione delle risposte nella chiave `'userMind'` di `globalState`.

#### TC-TOM-03: Visualizzazione e reset del profilo Theory of Mind
- **Categoria**: Gestione Stato ToM
- **Obiettivo**: Verificare la visualizzazione del profilo con `tars.logUserMind` e la sua cancellazione con `tars.flush`.
- **Precondizioni**: Profilo `userMind` salvato in `globalState`.
- **Procedura**:
  1. Eseguire il comando `tars.logUserMind`.
  2. Eseguire il comando `tars.flush`.
- **Risultato Atteso**:
  - `tars.logUserMind` mostra il profilo mentale corrente.
  - `tars.flush` cancella la chiave `'userMind'` e mostra la notifica `"Mental state flushed"`.

---

### 3.5 Categoria: Componenti Interni, Factory LLM e Agente (TC-INT)

#### TC-INT-01: Creazione istanza provider OpenAI tramite LLMFactory.createLLM
- **Categoria**: Unit Test — Factory
- **Obiettivo**: Verificare che `LLMFactory.createLLM` istanzi un oggetto `ChatOpenAI` con parametri corretti quando invocato con `LLMType.OPENAI`.
- **Precondizioni**: Modulo `src/agent/llmFactory.js` disponibile.
- **Procedura**:
  1. Invocare `LLMFactory.createLLM(LLMType.OPENAI, "gpt-4o", "sk-test-mock")`.
  2. Ispezionare le proprietà dell'oggetto restituito.
- **Risultato Atteso**: L'oggetto restituito è un'istanza di `ChatOpenAI` configurata con `model: "gpt-4o"`, `temperature: 0`, `maxTokens: 10000`, `maxRetries: 5`.

#### TC-INT-02: Creazione istanza provider DeepSeek tramite LLMFactory.createLLM
- **Categoria**: Unit Test — Factory
- **Obiettivo**: Verificare che `LLMFactory.createLLM` istanzi `ChatOpenAI` configurato con `maxTokens: 1000` per `LLMType.DEEPSEEK`.
- **Precondizioni**: Modulo `src/agent/llmFactory.js` disponibile.
- **Procedura**:
  1. Invocare `LLMFactory.createLLM(LLMType.DEEPSEEK, "deepseek-chat", "sk-test-mock")`.
  2. Ispezionare le proprietà dell'oggetto restituito.
- **Risultato Atteso**: L'oggetto restituito è un'istanza di `ChatOpenAI` configurata con `model: "deepseek-chat"` e `maxTokens: 1000`.

#### TC-INT-03: Verifica gestione provider Ollama in LLMFactory originale
- **Categoria**: Analisi Architetturale — Factory
- **Obiettivo**: Verificare il comportamento della factory originale quando invocata con `LLMType.OLLAMA`.
- **Precondizioni**: Codice originale di `src/agent/llmFactory.js`.
- **Procedura**:
  1. Invocare `LLMFactory.createLLM(LLMType.OLLAMA, "llama3", null)`.
- **Risultato Atteso**: Nel codice originale il ramo Ollama è commentato; la factory deve ricadere nel ramo `default` e sollevare l'eccezione `Error("No valid LLM type provided.")`.

#### TC-INT-04: Gestione eccezione per tipo LLM non supportato
- **Categoria**: Robustezza — Factory
- **Obiettivo**: Verificare che l'invocazione della factory con un tipo non supportato sollevi eccezione controllata.
- **Precondizioni**: Modulo `src/agent/llmFactory.js`.
- **Procedura**:
  1. Invocare `LLMFactory.createLLM("TIPO_NON_VALIDO", "model", null)`.
- **Risultato Atteso**: Rifiuto con eccezione `Error("No valid LLM type provided.")`.

#### TC-INT-05: Verifica supporto Structured Output in LLMFactory originale
- **Categoria**: Analisi Architetturale — Factory
- **Obiettivo**: Verificare se la factory originale accetti parametri di schema o applichi `.withStructuredOutput()`.
- **Precondizioni**: Ispezione dell'interfaccia di `LLMFactory`.
- **Procedura**:
  1. Esaminare la firma e il corpo di `LLMFactory.createLLM`.
- **Risultato Atteso**: La factory originale restituisce un modello base senza supporto allo structured output; accetta solo `(llmType, modelName, apiKey)` e non accetta schemi Zod o JSON Schema.

#### TC-INT-06: Compilazione e topologia del grafo LangGraph dell'agente
- **Categoria**: Unit Test — Grafo LangGraph
- **Obiettivo**: Verificare che il grafo LangGraph compili ed esponga esattamente i nodi attivi previsti dall'architettura originale.
- **Precondizioni**: Modulo `src/agent/agent.js`.
- **Procedura**:
  1. Invocare `agent.compile()`.
  2. Ispezionare i nodi registrati in `agent.nodes`.
- **Risultato Atteso**: Grafo compilato con successo contenente esattamente due nodi attivi: `plannerNode` e `syntaxCheck`. I nodi `critiqueNode`, `isCritiqueOK` e `isSyntaxOK` non devono risultare attivi nel grafo.

#### TC-INT-07: Verifica delle funzioni di utilità dell'agente (agentUtils.js)
- **Categoria**: Unit Test — Funzioni Pure
- **Obiettivo**: Verificare il corretto funzionamento di `doubleBraces`, `cleanLLMAnswer` ed `extractUsedConstructs`.
- **Precondizioni**: Modulo `src/agent/agentUtils.js`.
- **Procedura**:
  1. Testare `doubleBraces` su stringhe con parentesi graffe.
  2. Testare `cleanLLMAnswer` su risposte con delimitatori markdown e tag `<think>`.
  3. Testare `extractUsedConstructs` su dizionari di costrutti importati.
- **Risultato Atteso**:
  - `doubleBraces` raddoppia tutte le parentesi graffe `{` $\rightarrow$ `{{` e `}` $\rightarrow$ `}}`.
  - `cleanLLMAnswer` rimuove correttamente i blocchi markdown ```` ```json ```` e i tag DeepSeek `</think>\n`.
  - `extractUsedConstructs` estrae il codice dei soli costrutti citati nel sorgente.

#### TC-INT-08: Verifica del modulo di cache delle spiegazioni (cache.js)
- **Categoria**: Unit Test — Cache
- **Obiettivo**: Verificare il salvataggio e recupero in memoria e persistente delle spiegazioni.
- **Precondizioni**: Modulo `src/utils/cache.js`.
- **Procedura**:
  1. Memorizzare una spiegazione tramite `storeExplanation(chiave, dato)`.
  2. Recuperarla tramite `getCachedExplanation(chiave)`.
- **Risultato Atteso**: Recupero del medesimo oggetto precedentemente salvato, indicizzato tramite hash SHA-256 della chiave.

---

### 3.6 Categoria: Esecuzione End-to-End Spiegazione Codice (TC-E2E)

#### TC-E2E-01: Generazione spiegazione con OpenAI API reale (Cloud)
- **Categoria**: Test di Sistema End-to-End
- **Obiettivo**: Verificare il flusso completo di spiegazione del codice con un modello cloud OpenAI reale:
  invocazione comando $\rightarrow$ estrazione costrutti $\rightarrow$ costruzione prompt con Theory of Mind $\rightarrow$ chiamata a `ChatOpenAI` con structured output $\rightarrow$ validazione in `syntaxCheckNode` $\rightarrow$ produzione delle spiegazioni.
- **Precondizioni**: Chiave API OpenAI valida con credito attivo (`sk-proj-...`) configurata; modello `gpt-4o`; connessione a Internet attiva.
- **Procedura**:
  1. Configurare la chiave API reale nel file locale `.env` o tramite la Webview di TARS.
  2. Eseguire l'invocazione dell'agente con codice sorgente in ingresso (es. funzione JavaScript `calcolaSconto`).
  3. Verificare la risposta del modello e l'esito della validazione sintattica.
- **Risultato Atteso**: Il modello restituisce una lista strutturata conforme allo schema Zod (`results: [{text, description}]`); `syntaxCheckNode` valida con successo il JSON restituendo `syntaxCheckMessage: "OK"`.

#### TC-E2E-02: Generazione spiegazione con LLM Locale (Ollama / LM Studio) originale
- **Categoria**: Test di Sistema End-to-End
- **Obiettivo**: Verificare se il sistema originale consente l'esecuzione di spiegazioni con modelli open-weight locali (es. Ollama o LM Studio).
- **Precondizioni**: Server locale (Ollama su porta 11434 o LM Studio su porta 1234) attivo.
- **Procedura**:
  1. Tentare di configurare l'endpoint locale nella Webview di TARS originale.
  2. Tentare l'esecuzione della spiegazione senza una chiave OpenAI.
- **Risultato Atteso**: Il sistema originale non supporta modelli locali: la webview non offre campi per URL personalizzati e richiede obbligatoriamente una chiave OpenAI; il planner istanzia direttamente `ChatOpenAI` senza parametro `baseURL`.
