# Istruzioni di progetto

## Contesto

[Da compilare per ogni progetto: cosa fa il prodotto, per chi, stato attuale. La specifica completa è in `docs/SPEC.md`.]

## Stack

- Backend: Python 3.12, FastAPI, SQLAlchemy 2.x, Alembic, PostgreSQL, Pydantic v2, gestito con uv
- Frontend: React con React Compiler, Vite, TypeScript (strict), TanStack Router, Mantine, TanStack Query, Zustand, i18next, gestito con pnpm
- Qualità frontend: Oxlint (type-aware), Oxfmt, Vitest, Storybook
- Tooling: Docker e Docker Compose, Playwright per i test e2e

## Struttura del monorepo

```
apps/backend/      API FastAPI, modelli, migrazioni Alembic, test pytest
apps/frontend/     app React + Vite, configurazione Storybook in .storybook/
e2e/               test Playwright
docs/SPEC.md       specifica di prodotto
openapi.json       schema API esportato dal backend
docker-compose.yml
```

- Non mettere codice condiviso fuori da queste cartelle senza chiedere.
- Ogni modifica che tocca sia backend che frontend va pianificata come un'unica attività, partendo dal backend.

## Comandi

Ambiente locale (dalla root):

- `docker compose up -d`

Backend (da `apps/backend`):

- Installa dipendenze: `uv sync`
- Aggiungi dipendenza: `uv add <pacchetto>` (solo dopo approvazione)
- Test: `uv run pytest`
- Lint e tipi: `uv run ruff check .`, `uv run ruff format --check .`, `uv run mypy .`
- Nuova migrazione: `uv run alembic revision --autogenerate -m "<descrizione>"`
- Applica migrazioni: `uv run alembic upgrade head`
- Esporta schema API: `uv run python -m scripts.export_openapi` (scrive `openapi.json` nella root)

Frontend (da `apps/frontend`):

- `pnpm install`, `pnpm dev`, `pnpm build`
- Lint: `pnpm lint` (esegue `oxlint --type-aware`)
- Formattazione: `pnpm format` e `pnpm format:check` (eseguono `oxfmt` e `oxfmt --check`)
- Tipi: `pnpm typecheck` (esegue `tsc --noEmit`)
- Test unitari e di componente: `pnpm test` (esegue `vitest run`)
- Storybook: `pnpm storybook`, `pnpm build-storybook`
- Rigenera tipi API: `pnpm generate:api` (esegue `openapi-typescript ../../openapi.json -o src/api/generated/schema.d.ts`)

E2E (dalla root):

- `pnpm test:e2e`

## Contratto API

- La fonte di verità è lo schema OpenAPI generato dal backend.
- Lo schema esportato (`openapi.json`, nella root) è versionato nel repository, così ogni cambiamento del contratto è visibile nella diff.
- I tipi TypeScript sono generati da openapi-typescript in `apps/frontend/src/api/generated/schema.d.ts` e non vanno mai modificati a mano.
- Dopo ogni modifica a schemi Pydantic o rotte: esporta lo schema, rigenera i tipi, esegui `pnpm typecheck`. Gli errori di tipo nel frontend indicano i punti da aggiornare.
- Usa `response_model` e schemi espliciti su ogni rotta, così lo schema generato è preciso.

## Modo di lavorare

- Prima di modificare codice in modo non banale, proponi un piano: file coinvolti, approccio, dubbi. Attendi conferma.
- Se la richiesta è ambigua, fai domande invece di fare supposizioni.
- Lavora a passi piccoli. Dopo ogni passo esegui lint, formattazione, typecheck e i test pertinenti.
- Un compito è concluso solo quando lint, format check, typecheck e test passano.
- Non disabilitare mai regole di linter o type checker (`noqa`, `type: ignore`, `oxlint-disable`, `@ts-ignore`, `@ts-expect-error`) senza approvazione esplicita.
- Non aggiungere dipendenze senza chiedere.
- Non modificare migrazioni già applicate: crea sempre una nuova migrazione.
- Non eseguire comandi distruttivi (drop di tabelle, reset del DB, `rm -rf`, force push) senza conferma.
- Se trovi codice esistente che contraddice queste regole, segnalalo invece di correggerlo in silenzio.

## Backend

- Struttura a livelli: `routers`, `services`, `repositories`, `models`, `schemas`.
- Rotte sottili: la logica di business sta nei service.
- Schemi Pydantic separati per input e output. Non esporre mai i modelli ORM nelle risposte.
- Type hints ovunque.
- Eccezioni di dominio gestite da un handler centralizzato che produce risposte HTTP coerenti.
- Configurazione da variabili d'ambiente. Nessun segreto nel codice.
- Rivedi sempre le migrazioni autogenerate: Alembic sbaglia spesso su rinomine, enum e vincoli.
- Evita query N+1: carica esplicitamente le relazioni necessarie.
- Test con pytest su un PostgreSQL reale in Docker, non su SQLite.

## Frontend

### Struttura

- `src/routes/`: route di TanStack Router basate su file. I file di route restano sottili e delegano alle feature.
- `src/features/<feature>/{components,hooks,store}`: logica e componenti di ogni feature.
- `src/components/`: componenti UI riutilizzabili tra feature.
- `src/api/`: client tipizzato e tipi generati.
- Test e storie stanno accanto al file che verificano: `Nome.test.tsx`, `Nome.stories.tsx`.

### Regole generali

- TypeScript strict, niente `any`.
- UI con componenti Mantine e tema centralizzato. Niente stili inline arbitrari.
- Nessuna stringa visibile hardcoded: tutto passa da i18next, con chiavi organizzate per feature. Aggiungi ogni nuova chiave in tutte le lingue supportate.
- Gestisci sempre gli stati di caricamento, errore e lista vuota.

### React Compiler

- Il compilatore gestisce la memoizzazione: non aggiungere `useMemo`, `useCallback` o `memo` per ottimizzare, salvo un problema di performance misurato e approvato.
- Rispetta sempre le Rules of React (componenti e hook puri, niente mutazioni di props, stato o valori durante il render). Il compilatore salta i componenti che le violano.

### Routing

- Il route tree generato (`routeTree.gen.ts`) non va mai modificato a mano.
- Navigazione solo con `Link` e `useNavigate` tipizzati. Mai URL costruiti concatenando stringhe.
- Parametri di ricerca validati con `validateSearch` su ogni route che li usa.
- Precarica i dati nei `loader` delle route con `queryClient.ensureQueryData`, usando le stesse query options dei componenti.

### Dati e stato

- Chiamate API solo tramite il client tipizzato definito in `src/api/client.ts` (openapi-fetch + openapi-react-query), mai `fetch` scritte a mano verso il backend.
- Per leggere e scrivere dati usa `$api.useQuery` e `$api.useMutation`. Non ridefinire a mano i tipi di richiesta o risposta: derivali sempre da `schema.d.ts`.
- Query key derivate da openapi-react-query: per invalidare usa `$api.queryOptions(...).queryKey`, non chiavi scritte a mano.
- Stato server solo con React Query. Stato nell'URL (filtri, paginazione, tab) nei search params del router. Zustand solo per stato client globale. Stato locale con `useState`.

## Test

- Vitest per test unitari: hook, utility, store Zustand, logica di trasformazione dei dati.
- Storybook per i componenti: ogni componente riutilizzabile ha storie per gli stati principali (default, caricamento, errore, vuoto, disabilitato).
- Le storie sono eseguite anche come test di componente tramite l'integrazione Vitest di Storybook. Le interazioni importanti si verificano con `play`.
- Le storie usano dati mock e non chiamano il backend. Provider di Mantine, i18next e router sono configurati una sola volta come decorator in `.storybook/preview.tsx`.
- Playwright per i flussi critici end to end: autenticazione, flusso principale, casi di errore principali.
- Selettori basati su ruolo, label o testo (`getByRole`, `getByLabel`), mai su classi CSS.
- Ogni nuova funzionalità rilevante ha test unitari per la logica, storie per i nuovi componenti e almeno un test e2e del percorso principale.

## Sicurezza minima

- Validazione dell'input sempre lato server.
- Autorizzazione verificata su ogni endpoint, non solo l'autenticazione.
- L'autenticazione usa cookie httpOnly, Secure, SameSite=Lax gestiti dal backend.
- Non salvare mai token o dati di sessione in localStorage o sessionStorage.
- `.env.example` sempre aggiornato, `.env` mai nel repository.
