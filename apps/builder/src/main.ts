import { environment } from './environment/environment';
import { buildDrivers } from './app/drivers-openf1';
import { buildCircuits } from './app/circuits';
import { buildNewSeason } from './app/season-ics';
import { initCache } from './app/cached-fetch';
import { updateSeasonFromCalendar } from './app/update-season';
import { assetPath } from './app/assets';
import { buildTracks } from './app/tracks';
import { join } from 'path';
import { existsSync } from 'fs';
import { fixDriverStandings } from './app/fix-driver-standings';

/**
 * REMEMBER THAT THE PROJECT ID FROM THE ENVIRONMENT MUST BE THE SAME AS THE PROJECT ID IN THE EMULATOR
 * So start the emulator with --project=[project_id]
 */

// nx serve passes --args="--a --b" as one argument, so split it into separate flags
const args = process.argv.flatMap(arg => arg.split(/\s+/));
const purgeCache = args.includes('--purge-cache');
initCache(purgeCache);

const seasonId = parseInt(environment.season);
console.log(`Building season ${seasonId}`);

// buildDrivers()
//   .then(count => console.log(`Wrote ${count} drivers`))
//   .catch(error => console.error('Completed with errors', error));
// getTeams(seasonId - 1)
//   .then(teams => writeTeams(seasonId, teams))
//   .then(count => console.log(`Wrote ${count} teams`));


// import { environment } from "./environments/environment";

// buildNewSeason('2022')
//   .then(() => assignTeamsToSeason(seasonId))
//   .then(_ => console.log('Completed'))
//   .catch(error => console.error('Completed with errors', error));

// Bare skriv de først ti ud
// readUser().then(transactions => console.log(transactions.slice(0, 10)));

// readUser().then(transactions => console.log(transactions.slice(0, 10000)));
// Bare skriv de først ti ud

// readCollection('seasons').then(_ => JSON.stringify(_, null, '\t')).then(data => writeFileSync('seasons.json', data));
// 

// appendRaces('2020').then(() => assignTeamsToSeason(2020))
//   .then(() => console.log('Done'));
// copyRace(8, 7).then(() => console.log('Copied race'));
// appendRaces('2021').then(_ => console.log('Added races', _));
//  assignTeamsToSeason(2023);
// buildPreviousRaceResult(seasonId - 1).then(() => console.log(`Build previous season`));

// (async () => {
// await backupFirestore().then(() => console.log('Backed up'));
// await writeFirestore().then(() => console.log('Copied'));
// })();
/*
buildDrivers()
  .then(count => console.log(`Wrote ${count} drivers`))
  .then(() => buildCircuits())
  .then(numberOfCircuits => console.log('Circuits built', numberOfCircuits))
  .then(() => buildNewSeason(seasonId))
  .then(() => console.log('Season built'));
*/

if (args.includes('--fix-driver-standings')) {
  // Rebuild the driver standing from OpenF1. Dry run unless --write is passed.
  fixDriverStandings(seasonId, args.includes('--write'))
    .catch(error => {
      console.error('Fixing driver standings failed', error);
      process.exitCode = 1;
    });
} else if (args.includes('--tracks')) {
  // Write the track outlines for the race map into the UI's assets. Run from the workspace root, as nx serve does.
  const uiAssets = join(process.cwd(), 'apps/ui/src/assets');
  (existsSync(uiAssets) ? buildTracks(join(uiAssets, 'tracks')) : Promise.reject(`${uiAssets} not found. Run from the workspace root`))
    .then(count => console.log(`Wrote ${count} tracks`))
    .catch(error => {
      console.error('Building tracks failed', error);
      process.exitCode = 1;
    });
} else {
  // Rebuild the races after the last started race from an updated calendar. Dry run unless --write is passed.
  const write = args.includes('--write');
  (write ? buildCircuits().then(numberOfCircuits => console.log('Circuits built', numberOfCircuits)) : Promise.resolve())
    .then(() => updateSeasonFromCalendar(seasonId, assetPath(`f${seasonId}.ics`), write))
    .then(() => console.log('Season updated'))
    .catch(error => {
      console.error('Season update failed', error);
      process.exitCode = 1;
    });
}

/*
*/
// buildCircuits().then(
//   () => buildNewSeason(seasonId))
//   .then(() => console.log('Season built'));
//buildLastYear(seasonId).then(() => console.log('Last year built'));
