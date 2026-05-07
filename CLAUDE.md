# CLAUDE.md

Guidance for AI coding agents working in this repo. Keep responses short and accurate; this file is the source of truth for project conventions.

## What this is

**OpenAutomate** — a self-hostable Playwright test-management platform. A team creates projects, organizes tests into suites, queues runs, and inspects logs / traces / screenshots / videos. Each deployer brings their own Firebase project. MIT, MVP stage.

## Architecture in 60 seconds

Two processes against one Firebase project:

- **`web`** — Next.js 16 app. UI + API routes. Writes `queued` runs to Firestore.
- **`worker`** — Node loop (`apps/web/src/worker/test-run-worker.ts`). Polls Firestore for `queued` runs, claims them, executes Playwright, writes artifacts back to Storage and status to Firestore.

If the worker is down, runs sit in `queued`. The two processes share `apps/web/.env.local`.

## Project layout

```
apps/web/src/
├── app/                  # Next.js App Router. Route groups: (auth), (dashboard)
├── components/           # UI (ui/ = primitives; rest is feature-grouped)
├── lib/firebase/         # Client SDK only — uses NEXT_PUBLIC_* env
├── lib/server/           # Server-only (Admin SDK, env validation, artifacts)
├── lib/runner/           # Playwright execution logic
├── lib/hooks/            # Client data hooks
├── worker/               # Background worker entrypoint + claim logic
└── integration/          # Firestore rules tests (need emulator)

packages/shared/src/      # Shared types/utils — consumed by web
firebase/                 # firestore.rules, firestore.indexes.json, storage.rules
.dev/                     # Local dev scratch (gitignored). Emulator data, dummy creds, logs.
```

## Run it

### Local with Firebase emulators (no real Firebase project needed)

This is the default dev path. `.dev/` already contains a dummy service account and emulator data dir. `apps/web/.env.local` is pre-wired for emulator mode.

```bash
# Terminal 1 — emulators (auth :9099, firestore :8080, storage :9199, UI :4000)
npx firebase-tools emulators:start \
  --only auth,firestore,storage \
  --project demo-openautomate \
  --import .dev/firebase-data \
  --export-on-exit .dev/firebase-data

# Terminal 2 — web + worker (concurrently, web on :3000)
make dev
```

Health check: `curl localhost:3000/api/health` — should report worker online.

### Local against a real Firebase project

Replace the dummy values in `apps/web/.env.local` with real ones from your Firebase console (see `SETUP.md`), set `NEXT_PUBLIC_USE_EMULATORS=false`, and remove the `*_EMULATOR_HOST` lines. Then `make dev`.

## Test tiers

| Tier | Command | What it covers |
|---|---|---|
| Unit | `make test` / `npm run test` | Vitest. `*.test.ts` next to source. No emulator. |
| Integration | `make test-emulator` | Vitest in `src/integration/`. Boots emulators automatically, asserts Firestore rules. |
| E2E | `make test-e2e` | Playwright in `apps/web/e2e/`. Boots web app, smokes home/docs/login/signup. |

## Conventions

### Client vs server boundary
- `lib/firebase/` is **client only** — uses `NEXT_PUBLIC_*` env, runs in the browser.
- `lib/server/` is **server only** — uses Admin SDK, never imported from client components or hooks.
- Crossing this boundary breaks the build *or* leaks credentials. Don't.

### Env loading
- Web (Next.js) auto-loads `apps/web/.env.local`.
- Worker needs `dotenv/config` explicitly — already wired via `DOTENV_CONFIG_PATH=.env.local tsx -r dotenv/config`. Don't change without testing.
- `lib/server/env.ts` validates `FIREBASE_SERVICE_ACCOUNT_KEY` and `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` are present at boot.

### Emulator mode
- `lib/firebase/config.ts` connects to emulators when `NODE_ENV=development` AND `NEXT_PUBLIC_USE_EMULATORS=true`.
- Admin SDK auto-routes to emulators when `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` / `FIREBASE_STORAGE_EMULATOR_HOST` are set. The credential is "required but ignored" — `.dev/dev-service-account.json` is a real-format dummy with a throwaway RSA key.

### Permissions model
- `owner` — full project mutate + run + manage members
- `viewer` — read-only across project content and artifacts
- Logic lives in `lib/project-permissions.ts`. Firestore rules in `firebase/firestore.rules` enforce the same model server-side. **Both must agree** — if you change one, change the other and run `make test-emulator`.

### Run lifecycle
`queued` → `starting` → `running` → `completed` | `failed`
Stale runs are auto-failed by the worker (`markStaleRunsFailed`). Don't introduce new statuses without updating Firestore rules + UI states.

## Common gotchas

- **`auth/unauthorized-domain`**: use `http://localhost:3000`, not `127.0.0.1:3000`. Firebase Auth's authorized-domain list is exact-match.
- **Runs stuck in `queued`**: worker is down. Check `make dev` log or `/api/health`.
- **Worker fails at startup**: `FIREBASE_SERVICE_ACCOUNT_KEY` isn't valid JSON, or `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` is missing.
- **First emulator run is slow**: it downloads JARs on first run; cached after.
- **Storage uploads/reads fail**: check `firebase/storage.rules` was deployed, or that emulator storage is running.
- **AI test generation 500s**: `GEMINI_API_KEY` is empty. AI is optional; everything else still works.

## Processes (MVP-light)

### Branches
- Work happens on `main` for solo MVP work. For non-trivial changes, branch as `feat/<short-desc>` or `fix/<short-desc>`.

### Commits
- Imperative subject under ~72 chars (`add suite reorder`, not `added suite reorder`).
- Body explains *why*, not *what*. Skip the body for trivial changes.

### Before committing
- `make test` passes.
- If touching Firestore rules or `lib/project-permissions.ts`: `make test-emulator` passes.
- If touching UI: smoke the change in a browser at `localhost:3000`.
- No secrets — `.env.local`, `.dev/`, and service-account JSONs are gitignored; keep it that way.

### Pull requests (when multi-contributor)
- Title = the commit subject. Body = summary + test plan.
- Don't merge if `make test` is failing or rules tests broke.

## Don't do this

- Don't commit `apps/web/.env.local` or anything in `.dev/` — both are gitignored, keep them that way.
- Don't import from `lib/server/` in client components — it'll bundle Admin SDK creds into the browser bundle.
- Don't hand-roll Firestore queries that bypass `lib/project-permissions.ts` — rules will reject them anyway, but the UI will look broken.
- Don't introduce new top-level docs files for every minor decision. This project is intentionally MVP-shaped; if a doc isn't being read regularly, delete it.

## Design docs

For the bigger picture, read these in order. They describe what the code is and why, not how to use it.

- `docs/architecture.md` — system topology, the two-process model, why Firebase
- `docs/module-topology.md` — code layout and the import boundaries (server vs client vs runner)
- `docs/data-model.md` — every Firestore collection, field-by-field
- `docs/run-lifecycle.md` — the queued→completed state machine, lease/heartbeat/stale, cancel semantics
- `docs/flows.md` — end-to-end sequence diagrams (run, cancel, stale recovery, artifact access)

When code and docs disagree, code wins — but update the doc in the same PR.

## Files worth reading first

- `apps/web/src/lib/firebase/admin.ts` — Admin SDK init quirks
- `apps/web/src/lib/server/env.ts` — what env is required, where
- `apps/web/src/worker/test-run-worker.ts` — worker loop
- `apps/web/src/worker/claim-run.ts` — how runs get claimed (Firestore txn)
- `firebase/firestore.rules` — security model in code
- `apps/web/src/lib/project-permissions.ts` — same model on the client
