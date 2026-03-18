# OpenAutomate Setup Guide

This guide explains how to run your own OpenAutomate instance against **your own Firebase project**.

## 1. Clone and install

```bash
git clone <your-fork-or-repo-url>
cd OpenAutomate
make install
```

## 2. Create your Firebase project

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project.
3. Inside that project, enable:
   - `Authentication`
   - `Firestore Database`
   - `Storage`

## 3. Configure Firebase Authentication

In Firebase Console:

1. Go to `Authentication -> Sign-in method`
2. Enable:
   - `Email/Password`
   - `Google` if you want Google sign-in
3. Go to `Authentication -> Settings -> Authorized domains`
4. Add:
   - `localhost`
   - your production hostname later when you deploy

## 4. Create the Firebase web app

1. In Firebase Console, open `Project settings`
2. Under `Your apps`, create a **Web App**
3. Copy the Firebase config values
4. Create your local env file:

```bash
cp apps/web/.env.example apps/web/.env.local
```

5. Fill these values in `apps/web/.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
OPENAUTOMATE_WORKER_CONCURRENCY=1
```

## 5. Create the Firebase service account

The worker and authenticated artifact routes use the Firebase Admin SDK.

1. In Firebase Console, go to `Project settings -> Service accounts`
2. Click `Generate new private key`
3. Download the JSON file
4. Copy the full JSON into `FIREBASE_SERVICE_ACCOUNT_KEY` in `apps/web/.env.local`

Recommended format:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"...","client_id":"..."}'
```

Notes:
- Keep it as a single-line JSON string in `.env.local`
- Do not commit this file

## 6. Optional AI configuration

If you want AI test generation:

1. Create a Gemini API key
2. Add it to:

```bash
GEMINI_API_KEY=
```

If you do not set it, OpenAutomate falls back to mock AI generation.

## 7. Deploy Firebase rules

Install Firebase CLI if needed:

```bash
npm install -g firebase-tools
```

Then log in and connect your project:

```bash
firebase login
firebase use --add
```

Deploy rules and indexes from this repo:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

This repo uses:
- [firebase/firestore.rules](/Users/harikrishnanvs/Documents/personal/OpenAutomate/firebase/firestore.rules)
- [firebase/firestore.indexes.json](/Users/harikrishnanvs/Documents/personal/OpenAutomate/firebase/firestore.indexes.json)
- [firebase/storage.rules](/Users/harikrishnanvs/Documents/personal/OpenAutomate/firebase/storage.rules)

## 8. Run the app locally

OpenAutomate now uses two processes:
- `web` for the UI and API routes
- `worker` for background test execution

Run both together:

```bash
make dev
```

Or manually:

```bash
npm run web
npm run worker
```

Then open:

```text
http://localhost:3000
```

## 9. Verify the instance

1. Create an account
2. Create a project
3. Create a suite
4. Create a test case
5. Queue a run
6. Confirm the worker picks it up
7. Open `/api/health` and confirm:
   - env is healthy
   - worker is online

## 10. Run automated checks

Fast local test suite:

```bash
make test
```

Firebase emulator integration tests:

```bash
make test-emulator
```

The emulator test suite starts local Firebase Auth / Firestore / Storage emulators and validates the access rules that back the owner/viewer model.

Browser smoke tests:

```bash
make test-e2e
```

This starts a local app instance and verifies the public home page, docs page, and auth pages render correctly.

## 11. Production/self-hosted deployment

For a self-hosted deployment, you need:
- one `web` process/container
- one `worker` process/container
- the same Firebase env vars in both

Options:
- `make start`
- `docker compose up --build`

Production checklist:

1. Add your real hostname to Firebase Auth authorized domains
2. Set the same env vars on the host/platform
3. Run both `web` and `worker`
4. Verify `http://<your-host>/api/health`
5. Queue and complete one full test run

## Troubleshooting

### `auth/unauthorized-domain`

Use `http://localhost:3000` locally and make sure `localhost` is listed in Firebase Auth authorized domains.

### Runs stay `queued`

The worker is not running or cannot access Firebase Admin credentials.

Check:
- `npm run worker`
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `/api/health`

### Trace/video/screenshot links fail

Check:
- worker is running
- Storage rules are deployed
- the run completed after the current artifact-path changes

### Worker fails on startup

Check:
- `apps/web/.env.local` exists
- `FIREBASE_SERVICE_ACCOUNT_KEY` is valid JSON
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` is set
