# OpenAutomate

> Open source test management and browser automation platform for independent developers and small teams.

![Status](https://img.shields.io/badge/Status-Active%20Build-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## Overview

OpenAutomate lets a team:
- create projects for a web application
- organize tests into suites
- write and manage browser test cases
- queue Playwright-backed runs
- inspect logs, traces, screenshots, videos, and reports
- collaborate with an `owner` + `viewer` access model

This repo is designed for **self-hosted deployment**. Each team is expected to connect the app to **its own Firebase project**.

## Current Architecture

```text
OpenAutomate/
├── apps/
│   └── web/            # Next.js web app, API routes, worker entrypoint
├── packages/
│   └── shared/         # Shared types
├── firebase/           # Firestore rules, indexes, Storage rules
├── docker-compose.yml  # Two-service local/prod-style runtime
└── Makefile            # Convenience commands
```

### Runtime Model

OpenAutomate now runs as **two processes**:

- `web`
  - serves the Next.js UI and API routes
  - handles auth, project management, reports, and artifact access
  - queues runs in Firestore
- `worker`
  - polls Firestore for `queued` runs
  - claims and executes Playwright runs
  - writes logs, screenshots, videos, traces, and final status back to Firestore/Storage

If the worker is not running, runs will remain `queued`.

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Backend: Firebase Auth, Firestore, Storage
- Execution: Playwright
- Admin/Worker runtime: Firebase Admin SDK + Node worker loop

## What Works Today

- Firebase authentication
- projects CRUD
- suites CRUD
- test cases CRUD
- variables management
- member management (`owner` / `viewer`)
- queueing single test and suite runs
- real-time run updates
- traces, screenshots, videos, and console logs
- reports and basic analytics
- JSON / CSV report export
- AI-assisted draft generation and JSON import
- suite reordering
- health endpoint and worker status reporting

Still incomplete:
- nested suites
- scheduled runs
- Slack / Jira / webhook integrations
- deeper audit history
- full multi-role RBAC

## Quick Start

### Prerequisites

- Node.js 20+ recommended
- npm
- Firebase CLI
- a Firebase project you control

Install Firebase CLI if needed:

```bash
npm install -g firebase-tools
```

### 1. Clone and install

```bash
git clone <your-repo-url>
cd OpenAutomate
make install
```

### 2. Create your env file

```bash
cp apps/web/.env.example apps/web/.env.local
```

Fill it with values from **your own Firebase project**.

See:
- [apps/web/.env.example](/Users/harikrishnanvs/Documents/personal/OpenAutomate/apps/web/.env.example)
- [SETUP.md](/Users/harikrishnanvs/Documents/personal/OpenAutomate/SETUP.md)

### 3. Deploy Firebase rules and indexes

```bash
firebase login
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 4. Start the app

Recommended:

```bash
make dev
```

This starts both:
- the web app
- the execution worker

Then open:

```text
http://localhost:3000
```

## Setup in Detail

For the full Firebase walkthrough, service account setup, production notes, and troubleshooting, see:

- [SETUP.md](/Users/harikrishnanvs/Documents/personal/OpenAutomate/SETUP.md)

That document covers:
- creating a Firebase project
- enabling Auth / Firestore / Storage
- creating the Firebase web app
- creating the Firebase service account
- filling `apps/web/.env.local`
- deploying rules and indexes
- running web + worker
- verifying `/api/health`

## Required Environment Variables

The app expects these values in `apps/web/.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_SERVICE_ACCOUNT_KEY=
GEMINI_API_KEY=
OPENAUTOMATE_WORKER_CONCURRENCY=1
NEXT_PUBLIC_USE_EMULATORS=false
```

Notes:
- `FIREBASE_SERVICE_ACCOUNT_KEY` must be the full JSON service account as a single-line string.
- `GEMINI_API_KEY` is optional.
- `OPENAUTOMATE_WORKER_CONCURRENCY` is optional and defaults to `1`.
- local auth should use `http://localhost:3000`, not `127.0.0.1:3000`, unless you explicitly authorize both in Firebase Auth.

## How to Use the App

### 1. Sign up or sign in

Open the app and create an account using:
- email/password
- Google sign-in, if enabled in your Firebase project

### 2. Create a project

From `Projects`:
- click `New Project`
- enter a project name
- enter the base URL of the application under test

Each project becomes the container for:
- suites
- test cases
- variables
- runs
- reports
- members

### 3. Configure team access

Open `Project Settings`:
- add viewers by email
- remove viewers
- manage project variables

Access model:
- `owner`: can edit content, manage members, manage variables, and trigger runs
- `viewer`: can inspect projects, suites, test cases, runs, reports, traces, screenshots, and videos

### 4. Add suites

Inside a project:
- open `Test Suites`
- create suites for major flows or product areas
- reorder suites using the up/down controls

Examples:
- Authentication
- Checkout
- Settings
- Billing

### 5. Add test cases

Inside `Test Cases` or a suite page:
- create a test case
- assign it to one or more suites
- define steps with selectors and values
- set priority and tags
- keep it in `draft` until ready, then move it to `active`

Supported workflows:
- manual creation
- AI generation
- JSON import
- duplication
- bulk move / delete

### 6. Add variables

Inside `Project Settings -> Variables`:
- define reusable values like credentials, URLs, tokens, or form values
- reference them in steps as:

```text
{{VARIABLE_NAME}}
```

Example:

```text
{{USER_EMAIL}}
{{BASE_LOGIN_URL}}
```

### 7. Queue runs

Owners can trigger:
- a single test case run
- a full suite run

When you click `Run`:
- the web app writes a `queued` run to Firestore
- the worker claims it
- execution moves through `starting` → `running` → `completed` / `failed`

If the worker is down, the run stays `queued`.

### 8. Inspect test runs

Open `Test Runs` inside a project to:
- watch live run status
- open a run detail page
- inspect step-by-step execution
- inspect console output
- view screenshots
- view or download traces
- watch video if enabled

### 9. Use reports

Open `Reports` inside a project to:
- inspect pass/fail trends
- view recent run history
- identify slow or flaky tests
- export runs as JSON or CSV

### 10. Check system health

Open:

```text
/api/health
```

This tells you whether:
- required server env vars are present
- the worker is online
- the worker is heartbeating

The dashboard also shows worker status.

## Local Development Commands

### npm scripts

```bash
npm run web         # web app only
npm run worker      # worker only
npm run dev:all     # web + worker in development
npm run build       # build the repo
npm run test        # fast unit/integration tests without emulators
npm run test:emulator # Firebase emulator-backed rules tests
npm run test:e2e    # Playwright browser smoke tests
npm run web:start   # start built web app
npm run start:all   # start built web app + worker
npm run lint        # lint
```

### Make targets

```bash
make install
make build
make test
make test-emulator
make test-e2e
make web
make worker
make dev
make start
make compose-up
make down
make logs
make health
```

## Docker

Docker is optional, but useful when you want a production-style local or server deployment.

This repo includes:
- [Dockerfile](/Users/harikrishnanvs/Documents/personal/OpenAutomate/Dockerfile)
- [docker-compose.yml](/Users/harikrishnanvs/Documents/personal/OpenAutomate/docker-compose.yml)

To run both services with Docker:

```bash
docker compose up --build
```

This starts:
- `web`
- `worker`

Both read the same env file and connect to the same Firebase project.

## Testing

For the normal fast test suite:

```bash
make test
```

For Firebase emulator-backed integration tests:

```bash
make test-emulator
```

The emulator suite starts local Firebase emulators and verifies:
- owner vs viewer Firestore rules
- shared project read access
- viewer write restrictions
- owner-only run queue permissions

These tests run against local emulators, not your hosted Firebase project.

For browser smoke coverage:

```bash
make test-e2e
```

The Playwright suite boots a local app instance and verifies the public home, docs, login, and signup flows render correctly.

## Production Deployment

OpenAutomate v1 is intended for **self-hosted** deployment.

### Deploy Your Own Instance

Each user or team should:
- clone the repo
- create their own Firebase project
- set their own env vars
- deploy the repo’s Firestore / Storage rules
- run both the web app and worker

That means you can publish this repo without sharing your Firebase backend.

### Production Checklist

1. Create a Firebase project for the deployment.
2. Enable Auth, Firestore, and Storage.
3. Add your production domain to Firebase Auth authorized domains.
4. Set the same env vars on both `web` and `worker`.
5. Deploy Firestore rules, indexes, and Storage rules.
6. Start both runtime processes.
7. Verify `/api/health`.
8. Queue and complete a real run.

### Production Runtime Choices

You can run this as:
- two Node processes on one VM
- two Docker containers
- two services on a container platform

Required services:
- `web`
- `worker`

Firebase remains external and is not replaced by Docker.

## Security Model

- owners can mutate project content and queue runs
- viewers are read-only
- artifacts are accessed through authenticated server endpoints
- raw public artifact reads are not the intended access pattern

## Repo Structure

```text
apps/web/src/
├── app/                # App Router pages and API routes
├── components/         # UI and feature components
├── lib/firebase/       # Firebase client/admin setup
├── lib/hooks/          # Client data hooks
├── lib/runner/         # Playwright execution logic
├── lib/server/         # Server-side helpers
└── worker/             # Background worker entrypoint
```

## Troubleshooting

### `auth/unauthorized-domain`

Use `http://localhost:3000` and make sure `localhost` is authorized in Firebase Auth.

### Runs never start

Check:
- the worker is running
- `/api/health`
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- Firestore rules and indexes were deployed

### Runs stay `queued`

The worker is not online or cannot claim runs.

### Trace / screenshot / video access fails

Check:
- worker completed the run
- Storage rules are deployed
- the artifact was generated by a current run

### Worker startup fails

Check:
- `apps/web/.env.local` exists
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` is set
- `FIREBASE_SERVICE_ACCOUNT_KEY` is valid JSON

## License

MIT
