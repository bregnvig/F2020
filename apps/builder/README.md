# Builder

## Intention

To build a new season with races, drivers etc.

## Data sources

The Ergast API is gone, so the builder now uses:

- **[OpenF1 API](https://openf1.org)** for drivers, sessions, results, starting grids, laps and weather. It's called without authentication.
  - `https://api.openf1.org/v1/drivers`: all drivers, and `?session_key=latest` for the currently active ones
  - `https://api.openf1.org/v1/sessions?year={{season}}`: the meetings and sessions of a season
  - `https://api.openf1.org/v1/session_result?session_key={{key}}`: qualifying and race results
  - `https://api.openf1.org/v1/starting_grid?session_key={{key}}`
  - `https://api.openf1.org/v1/laps?session_key={{key}}`
  - `https://api.openf1.org/v1/weather?session_key={{key}}`
- **`src/assets/f{{season}}.ics`**: the race calendar for the season. Add a new file for each new season.
- **`src/assets/circuits.json`**: the circuits.
- **OpenAI**: `humanizer.ts` uses it to write the weather descriptions.

OpenF1 responses are cached in `/tmp/openf1-cache`. Uncached requests are delayed 5 seconds to stay within the rate limit. To clear the cache, pass `--purge-cache`:

```sh
npx nx serve builder --args="--purge-cache"
```

## Configuration

Copy `src/environment.example.ts` to `src/environment/environment.ts`, and to `environment.prod.ts` for the production configuration, then fill in:

- `season`: the season to build, e.g. `'2026'`
- `firebase`: a service-account key. Get it from Firebase console → Project settings → Service accounts → Generate new private key.
- `openai`: `apiKey`, `organization` and `project`

The `src/environment/` folder is git-ignored. Never commit the real files.

## Running

What gets built is decided in `src/main.ts`. By default it builds drivers, circuits and then the season from `environment.season`.

### Against the emulator

The Admin SDK only uses the emulator when `FIRESTORE_EMULATOR_HOST` is set. **Without it, the builder writes to the real Firebase project from the service-account key.**

```sh
# 1. Start the emulator first, with the same project as project_id in the service-account key
firebase emulators:start --only=functions,firestore,auth,pubsub --config=firebase.json --import=./saved-data --export-on-exit=./saved-data --project f1-playground-e1f23

# 2. In another shell
export FIRESTORE_EMULATOR_HOST="localhost:8080"
npx nx serve builder
```

If the project IDs don't match, the data is written to a different emulator namespace and the UI won't see it.

### Against a real project

Make sure `FIRESTORE_EMULATOR_HOST` is **not** set (`unset FIRESTORE_EMULATOR_HOST`). Then run:

```sh
npx nx serve builder                           # development environment.ts
npx nx serve builder --configuration=production  # environment.prod.ts
```

## Data model

```json5
{ 
    season: {
        latestWBCJoinDate: 'before qualify the third race',
        latestRace: 'Denormalized copy of the latest race',
        currentRace: 'Denormalized copy of the current race',
        race: [
            {
              state: 'waiting, opened, closed, complete',
              openDate: 'Date of when the race opens. Normally monday after previous race',
              closeDate: 'Date of when the race closes. When the 1. free practice starts',
              location: 'The geolocation in some form',
              url: 'URL to the wiki page of the race',
              bids: [
                {
                  data: 'Contains the bids and eventually the points tally. Structure not defined'
                }       
              ],
              result: {
                data: 'Contains the result. Structure not defined'
              },
              selectedDriver: 'The selected driver',
              drivers: [
                // Any array of drivers active at the specific race
              ] 
            }     
        ], // Separate collection
        drivers: [ // Separate collection
          // An array of drivers that has participated in this season.
          // They will be marked as active or not active
        ],
        wbc:      
    }
}
```
