# Reverse engineering dell'architettura attuale di TARS

I tre diagrammi descrivono il sorgente attuale, prima di CR1 e CR2. Non propongono modifiche. Installazione, compilazione, avvio in VS Code e apertura di Configure TARS sono stati verificati dall'utente; questa documentazione deriva dall'analisi statica del codice. Il bundle `dist/extension.js`, gia modificato prima di questa attivita, non e stato alterato.

## Component Diagram

File: [component-diagram.puml](component-diagram.puml).

Mostra i moduli dell'estensione e le dipendenze da VS Code, OpenAI e Ollama. `explainCodeCommand()` coordina estrazione del codice, profilo ToM, retrieval, cache, agente e decorazioni. Il planner costruisce direttamente `ChatOpenAI`; `LLMFactory` e raggiunta soltanto da `critiqueNode()`, funzione non registrata nel grafo. Il RAG usa embeddings Ollama e `MemoryVectorStore`: Chroma non e attivo. Il grigio e le frecce tratteggiate distinguono il codice scollegato dal percorso operativo.

## Class Diagram

File: [class-diagram.puml](class-diagram.puml).

Il progetto e principalmente procedurale: per non inventare classi, il diagramma distingue i moduli JavaScript (`<<module>>`), l'oggetto letterale `LLMFactory`, lo schema `agentState` e le classi reali, incluse quelle delle librerie. `planner()` e una funzione di `agent.js`; `agent` e un'istanza `StateGraph`. Le classi applicative rappresentate sono `LLMType` e `MyCustomChatModel`; quest'ultima estende `SimpleChatModel` ma non e collegata alla generazione attiva. Le operazioni delle librerie sono selezionate per spiegare le dipendenze e non rappresentano API complete.

## Sequence Diagram

File: [sequence-diagram.puml](sequence-diagram.puml).

Descrive il comando `tars.explain-code`: lettura della configurazione e del profilo, estrazione dei costrutti, retrieval prima della cache, generazione strutturata, parsing e decorazioni. L'indicizzazione PDF e un comando separato ed e riassunta nella legenda. I rami relativi a configurazione e quiz mancanti mostrano l'apertura delle webview senza inventare un'attesa del salvataggio: il codice attuale non la implementa. Il percorso successivo assume dati disponibili. Il caso principale di generazione e quello riuscito; il comportamento di errore dell'invocazione e descritto nella legenda.

## Osservazioni necessarie per leggere correttamente i diagrammi

- Il grafo collega soltanto `START -> plannerNode -> syntaxCheck`. La registrazione di `critiqueNode` e gli archi condizionali sono commentati. Non viene dichiarato un arco finale esplicito verso `END`; i diagrammi non ne aggiungono uno e non costituiscono una verifica runtime del grafo.
- La configurazione salva `llmType: "openai"`, mentre `explainCodeCommand()` confronta il valore con `"api"`. Il valore salvato viene quindi mappato a `LLMType.OLLAMA`, ma il planner ignora il tipo e crea comunque `ChatOpenAI`.
- Il planner usa `withStructuredOutput(schema, {strict: true})`, senza indicare il metodo. La risposta attesa e `{results: [{text, description}]}`; il planner serializza l'array e `syntaxCheckNode()` lo riparsa. Non e rappresentato un protocollo specifico di function calling, perche non e selezionato esplicitamente nel sorgente.
- `LLMFactory.createLLM()` gestisce `OPENAI` e `DEEPSEEK`, entrambi con `ChatOpenAI` e senza endpoint personalizzato. Il caso `OLLAMA` e commentato; `initializeOllamaModel()` e definita ma non chiamata. `HUGGINGFACE` non ha un caso nella factory.
- ToM raccoglie risposte in una webview e le salva in `globalState`: non effettua una chiamata LLM autonoma. Il profilo viene poi inserito nel prompt del planner.
- Gli embeddings usano `mxbai-embed-large:335m-v1-fp16` su `http://localhost:11434`. Il vector store e volatile. Il retriever con `k: 2` viene creato ma non usato: la ricerca effettiva usa `similaritySearchVectorWithScore(..., 3)`.
- Il retrieval avviene anche in caso di cache presente. La cache considera codice e profilo, senza modello o documentazione. Nel fallback all'intero file il target non ha `name`: il retrieval puo fallire e restituire `[]`.
- In caso di errore LLM il planner mostra un messaggio e rilancia; il comando registra l'errore ma poi legge comunque `agentResponse.outputStructure`. Non e implementato un recupero affidabile da questo errore.
- `src/config/extensionConfig.js` e vuoto. Le impostazioni effettive sono in `configureTarsCommand.js` e `context.globalState`.
- Sono omessi i comandi accessori di help e alcuni dettagli interni di parsing e rendering per mantenere le viste focalizzate sui componenti richiesti.

## Tracciabilita verso i sorgenti

Radice analizzata: `/Users/salvolepore/Projects/tars`.

| Area | Percorsi rispetto alla radice |
| --- | --- |
| Attivazione e manifest | `extension.js`, `package.json` |
| Orchestrazione del comando | `src/commands/explainCodeCommand.js` |
| Agente, planner e critica | `src/agent/agent.js` |
| Stato e tipi | `src/agent/agentState.js` |
| Factory e inizializzazione Ollama scollegata | `src/agent/llmFactory.js` |
| Prompt e utilita | `src/agent/agentUtils.js` |
| Adapter Hugging Face scollegato | `src/agent/myCustomChatModel.js` |
| Configurazione | `src/commands/configureTarsCommand.js`, `src/config/extensionConfig.js` |
| Theory of Mind | `src/commands/tomCommand.js` |
| Estrazione del codice | `src/utils/constructsRetriever.js` |
| Decorazioni | `src/utils/extensionUtils.js`, `src/commands/toggleDecorationsCommand.js` |
| Cache | `src/utils/cache.js` |
| Indicizzazione PDF | `src/commands/indexProjectDocumentsCommand.js` |
| Retrieval e archivio vettoriale | `src/vectorDB/vectorRetriever.js`, `src/vectorDB/vectorStore.js` |
| Embeddings | `src/vectorDB/embeddingsModel.js` |

## Visualizzazione

Aprire i file `.puml` con un visualizzatore PlantUML. Con PlantUML e le dipendenze di rendering gia installati, dalla radice del repository:

```bash
plantuml -tsvg docs/reverse-engineering/component-diagram.puml
plantuml -tsvg docs/reverse-engineering/class-diagram.puml
plantuml -tsvg docs/reverse-engineering/sequence-diagram.puml
```

I comandi generano SVG accanto ai sorgenti PlantUML. Il rendering non e stato eseguito durante questa attivita: non e stato trovato un eseguibile PlantUML locale. Non sono stati installati strumenti o inviate informazioni del progetto a servizi di rendering esterni.
