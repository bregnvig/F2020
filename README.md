# F2020

<p align="center"><img src="https://github.com/bregnvig/F2020/blob/develop/apps/ui/src/assets/icons/icon-192x192.png?raw=true" width="350"></p>

This is the Formula 1 betting site. Players bid on each race, and results are fetched from the [OpenF1 API](https://openf1.org).

The project is an Nx monorepo.

## Tech stack

### Frontend (`apps/ui`)

- Angular
- Angular Material
- tailwindcss

### Backend (`apps/functions`, `apps/firebase`)

- Firebase
- Firestore
- Functions
- Cloud Messaging

### Builder (`apps/builder`)

A Node script that populates Firestore with drivers, circuits and a new season. See [apps/builder/README.md](apps/builder/README.md).

### Data

All F1 data comes from the [OpenF1 API](https://openf1.org) (`libs/openf1` holds the types). The race calendar is read from `.ics` files in `apps/builder/src/assets`.

## Prerequisites

- Node and Java versions are pinned in `mise.toml`. Run `mise install`. Java is needed by the Firestore emulator.
- Firebase CLI: `npm install` installs `firebase-tools`, or use a global install.
- `apps/functions/environment/.env`. It's git-ignored and copied into `dist/apps/functions` on build. It must contain:

  ```dotenv
  OPEN_F1_USERNAME=...
  OPEN_F1_PASSWORD=...
  OPEN_AI_API_KEY=...
  OPEN_AI_ORGANIZATION=...
  OPEN_AI_PROJECT=...
  ```

- `apps/builder/src/environment/environment.ts`. It's git-ignored. Copy `apps/builder/src/environment.example.ts` and fill in the values. Do this only if you run the builder.

## Up and running

1. Build the functions and watch for changes:
   `npm run serve:firebase` (or `npx nx run firebase:watch`)
2. Start the emulators:
   ```sh
   firebase emulators:start --only=functions,firestore,auth,pubsub --config=firebase.json --export-on-exit=./saved-data --import=./saved-data --inspect-functions --project f1-playground-e1f23
   ```
   Remove `--export-on-exit`, `--import` and/or `--inspect-functions` if you don't need them.
3. Start the UI: `npm run start` (or `npx nx serve ui`).
   `apps/ui/src/environments/environment.ts` has `useEmulator: true`, so the UI connects to the Firestore, Auth and Functions emulators.
4. If the ports are already taken, run `npm run kill-ports`.

`npx nx run firebase:serve` runs steps 1 and 2 together.

## Working with the Firebase emulator

The Firebase Admin SDK only talks to the emulator if it's told to through environment variables. **Without them, scripts using the Admin SDK write to the real Firebase project**. This includes the builder, and anything you run outside `firebase emulators:start`.

Export these in the shell where you run the script:

```sh
export FIRESTORE_EMULATOR_HOST="localhost:8080"
export FIREBASE_AUTH_EMULATOR_HOST="localhost:9099"   # only needed if the script uses Auth
```

The ports are the ones configured in `firebase.json`. Remember:

- Start the emulator **before** running the script.
- The emulator's `--project` must match the project the script uses. For the builder, that's `project_id` in its service-account key. Otherwise the data ends up in a different emulator namespace and the UI won't see it.
- Run `unset FIRESTORE_EMULATOR_HOST FIREBASE_AUTH_EMULATOR_HOST` before you intentionally target a real project.

Functions running inside the emulator get these variables automatically. You don't need to export them for the functions.

## Firebase projects

Defined in `.firebaserc`:

| Alias | Project | Use |
|---|---|---|
| `default` | `f1-playground-e1f23` | Local development / emulator |
| `production` | `f1-2024-8ab8e` | Production |
| `old` | `f1-2020-9dec0` | Old site |

## Build & deploy

- `npm run build:ui`: production build of the UI
- `npm run deploy:hosting`: deploy the UI to production
- `npm run deploy:functions`: deploy functions to production
- `npm run deploy:rules`: deploy Firestore rules to production
- `npm run deploy:all`: all of the above

## Google Cloud Console

### API & Services

Under credentials → Web client, add any new URL that you want to use for authentication and serving.
