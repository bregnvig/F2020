# F2020

<p align="center"><img src="https://github.com/bregnvig/F2020/blob/develop/apps/ui/src/assets/icons/icon-192x192.png?raw=true" width="350"></p>

This is the Formula 1 betting site. 
The application is developed using

## Frontend

* Angular
* Angular Material
* tailwindcss
* NgRx

## Builder

Use environment to decide which firestore database to populate.

If you need to populate the firebase emulator use `export FIRESTORE_EMULATOR_HOST="localhost:8080"`. Remember to start the emulator before executing the builder.

`npx nx serve builder --environment=dev`

## Backend

* Firebase
* Firestore
* Functions
* Cloud Messaging

The project is supported by the Nx mono repo.

## Up and running

To populate Firestore use the `npx nx serve builder` app.
To run UI run `npx nx serve ui`

# Project Cloud

## Use v16 for both running and exporting data

Start by adding a `.runtimeconfig.json` to the `apps/cloud` folder

You can create it using `firebase functions:config:get > .runtimeconfig.json`	

1. Start by running npx nx serve cloud
2. Run emulators use `firebase emulators:start --only=functions,firestore,auth,pubsub --config=firebase.json --export-on-exit=./saved-data --import=./saved-data --inspect-functions` Delete `export`, `import` and/or `--inspect-functions` if not wanted
3. If ports are already taken, run `npm run kill-ports` 
