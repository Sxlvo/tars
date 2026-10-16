# Architettura originale di TARS

Le tre viste rappresentano il codice attuale, prima di CR1 e CR2. Sono selettive: mostrano le responsabilita principali senza riprodurre ogni funzione o chiamata. I nomi abbreviati dei componenti sono associati ai sorgenti nella tabella seguente. Nessuna classe applicativa e stata inventata.

## Component Diagram

[component-diagram.puml](component-diagram.puml) contiene **otto componenti**. VS Code esegue i comandi registrati in `extension.js`; Commands raggruppa attivazione e comandi. Il comando di spiegazione usa configurazione, ToM, RAG e agente. Il planner crea direttamente `ChatOpenAI`. La dipendenza verso `LLMFactory` e tratteggiata perche appartiene a `critiqueNode()`, definita ma non collegata al grafo. La factory crea anch'essa `ChatOpenAI`.

Sono omessi cache, librerie interne, servizi esterni e collegamenti delle webview verso VS Code. Configurazione e ToM salvano rispettivamente `tarsConfiguration` e `userMind` in `context.globalState`; il comando legge questi dati e li passa all'agente. RAG usa `MemoryVectorStore` e `OllamaEmbeddings` locale, non Chroma.

## Class Diagram

[class-diagram.puml](class-diagram.puml) concentra la vista sulle dipendenze interessate da CR1. Gli stereotipi distinguono funzioni, modulo, oggetto letterale, struttura `Annotation.Root` e classe di libreria. `planner()` e `critiqueNode()` sono funzioni di `agent.js`, non classi; `LLMFactory` e un oggetto letterale. `agentState` mostra solo i tre campi relativi al modello.

Il comando prepara lo stato passato a `agentInstance.invoke()`; il planner ne legge i parametri e costruisce direttamente `ChatOpenAI`, applicando lo schema strutturato. Soltanto `critiqueNode()` chiama la factory. Il diagramma non aggiunge una dipendenza dal planner alla factory. La configurazione arriva al comando attraverso `globalState`, non attraverso una chiamata dal planner al modulo di configurazione.

## Sequence Diagram

[sequence-diagram.puml](sequence-diagram.puml) usa **sette partecipanti** e mostra il percorso riuscito con editor attivo, configurazione e profilo gia salvati e cache assente. Per ogni target, il comando recupera la documentazione, invoca il grafo e visualizza la spiegazione. Il partecipante `agent / planner` riassume il grafo compilato e le funzioni interne di `agent.js`; `chain.invoke()` indica la catena prompt-modello che invoca `ChatOpenAI`. Il messaggio finale a VS Code sintetizza la chiamata a `decorateExplanation()` e le successive API di decorazione.

Sono omessi apertura delle webview, gestione errori, cache, compilazione del grafo, dettagli del prompt e indicizzazione PDF. La cache viene controllata dopo il retrieval; se presente, evita la generazione LLM. Non e rappresentato alcun ciclo di self-refinement, perche non e attivo.

## Precisazioni sul codice originale

- Il grafo registra `plannerNode` e `syntaxCheck`, collegati da `START -> plannerNode -> syntaxCheck`. Critica e archi condizionali sono commentati; non e dichiarato un arco finale esplicito verso `END`.
- Il planner usa `withStructuredOutput(schema, {strict: true})` senza selezionare esplicitamente il metodo. L'oggetto atteso contiene `results`, array di coppie `text` e `description`; il planner serializza l'array e `syntaxCheckNode()` esegue il parsing JSON.
- La configurazione salva `llmType: "openai"`, ma il comando confronta il valore con `"api"`: lo stato riceve quindi `LLMType.OLLAMA`. Il planner attuale ignora tale campo e crea comunque `ChatOpenAI`.
- La factory gestisce `OPENAI` e `DEEPSEEK` con `ChatOpenAI`, senza endpoint personalizzato. Il caso `OLLAMA` e commentato. La funzione `initializeOllamaModel()` non e chiamata dal percorso attivo; `MyCustomChatModel` per Hugging Face e anch'essa scollegata e omessa dalla vista CR1.
- ToM e un questionario locale, senza una propria chiamata LLM. Il profilo viene incluso nel prompt del planner.
- Il RAG indicizza PDF con un comando separato. Usa embeddings `mxbai-embed-large:335m-v1-fp16` su `http://localhost:11434` e un archivio volatile in memoria; la ricerca effettiva restituisce fino a tre risultati.

## Tracciabilita

Radice del progetto: `/Users/salvolepore/Projects/tars`.

| Elemento | Sorgenti rispetto alla radice |
| --- | --- |
| VS Code / Commands | `extension.js`, `src/commands/explainCodeCommand.js` |
| Configurazione LLM | `src/commands/configureTarsCommand.js` |
| Theory of Mind | `src/commands/tomCommand.js` |
| Agent / Planner / critica | `src/agent/agent.js` |
| Stato e tipi LLM | `src/agent/agentState.js` |
| LLMFactory | `src/agent/llmFactory.js` |
| ChatOpenAI | Libreria `@langchain/openai`, importata da agente e factory |
| RAG | `src/vectorDB/vectorRetriever.js`, `src/vectorDB/vectorStore.js`, `src/vectorDB/embeddingsModel.js`, `src/commands/indexProjectDocumentsCommand.js` |
| Estrazione e visualizzazione sintetizzate | `src/utils/constructsRetriever.js`, `src/utils/extensionUtils.js` |
| Cache omessa dalle viste | `src/utils/cache.js` |

## Impaginazione e verifica

Colori sobri, nomi brevi e identificatori univoci. Le viste statiche usano orientamento da sinistra a destra e collegamenti ortogonali; la sequenza usa l'ordine temporale verticale UML. Le viste sono pensate per essere inserite singolarmente in una pagina A4 orizzontale, preferibilmente esportate in SVG e scalate mantenendo le proporzioni.

Verifica locale con PlantUML 1.2026.2:

```bash
java -jar /private/tmp/tars-plantuml-1.2026.2.jar -checkonly docs/reverse-engineering/*.puml
```

Per esportare con un'installazione PlantUML disponibile:

```bash
plantuml -tsvg docs/reverse-engineering/*.puml
```

La verifica e il rendering di controllo vengono eseguiti localmente, senza inviare i diagrammi a servizi esterni. Gli output di controllo sono temporanei; i file versionabili restano i tre `.puml` e questo README. Il codice applicativo non viene modificato.
