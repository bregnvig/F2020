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

Copy `src/environment.example.ts` to `src/environment/environment.ts` and fill in:

- `season`: the season to build, e.g. `'2026'`
- `firebase`: a service-account key. Get it from Firebase console → Project settings → Service accounts → Generate new private key.
- `openai`: `apiKey`, `organization` and `project`

`environment.ts` is the only environment file the builder uses. To target another Firebase project, change the service-account key in it.

The `src/environment/` folder is git-ignored. Never commit the real files.

## Running

What gets built is decided in `src/main.ts`. Right now it updates the remaining races of the season from an updated calendar. The full season build (drivers, circuits, season, last year and standings) is commented out.

### Updating the remaining races of a season

`update-season.ts` reads `src/assets/f{{season}}.ics`. Replace that file with the latest calendar from F1 before running it. It finds the last race in Firestore that has started, and rewrites the calendar races after it from the next round onwards. Existing races with those round numbers are overwritten, and leftover rounds after the new last round are deleted.

- It refuses to overwrite races that are `closed`, `completed` or `cancelled`, and to delete races that aren't `waiting` or that have bids.
- An `open` race gets the new circuit and dates, but keeps its state, drivers, teams, selections and bids.
- The season document, teams, last year and standings are left untouched.

It's a dry run unless you pass `--write`:

```sh
npx nx serve builder                                    # dry run: prints what would change
npx nx serve builder --args=--write --watch=false       # writes circuits and races, then exits
```

### Track outlines for the race map

```sh
npx nx serve builder --args=--tracks --watch=false
```

This writes the outline of every circuit in `src/assets/circuits.json` to `apps/ui/src/assets/tracks/{circuitId}.json`, which the race page draws on the map. The outlines come from [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) (MIT). Each circuit's `trackId` is its id in that dataset. It doesn't touch Firestore. Rerun it when you add a circuit, and commit the generated files.

### Fixing the driver standings

```sh
npx nx serve builder --args=--fix-driver-standings --watch=false            # dry run: prints the standing
npx nx serve builder --args="--fix-driver-standings --write" --watch=false  # writes it
```

This rebuilds `seasons/{season}/standings/all-drivers` from OpenF1. Points come from the championship after the last `completed` race in Firestore. Wins are counted from the race and sprint winners of the completed races. Run it with `--purge-cache` if OpenF1 has changed results since they were cached.

### Fixing the driver results

```sh
npx nx serve builder --args=--fix-driver-results --watch=false            # dry run: prints old → new values
npx nx serve builder --args="--fix-driver-results --write" --watch=false  # writes them
```

This recalculates `retired`, `averageFinishPosition` and `averageGridPosition` of every `seasons/{season}/standings/drivers/{season}/{driverId}`. The averages only count races where the driver has a position, i.e. was classified.

By default it uses the races and qualifyings already stored on each document, with duplicated rounds removed (the last one wins). It doesn't call OpenF1.

Pass `--reload` to map the race and qualifying of every `completed` race in Firestore from OpenF1 again, the same way the result function does. Use it when the stored results are wrong, e.g. a status mapped before a mapper fix:

```sh
npx nx serve builder --args="--fix-driver-results --reload" --watch=false          # dry run
npx nx serve builder --args="--fix-driver-results --reload --write" --watch=false  # writes them
```

Drivers that have a document but no result in OpenF1 are left untouched.

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

Put the service-account key of the target project in `environment.ts`. Make sure `FIRESTORE_EMULATOR_HOST` is **not** set (`unset FIRESTORE_EMULATOR_HOST`). Then run:

```sh
npx nx serve builder
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
