import { environment } from './environment/environment';
import { buildNewSeason } from './app/season-ics';
import { buildDrivers } from './app/drivers-openf1';
import { buildCircuits } from './app/circuits';

/**
 * REMEMBER THAT THE PROJECT ID FROM THE ENVIRONMENT MUST BE THE SAME AS THE PROJECT ID IN THE EMULATOR
 * So start the emulator with --project=[project_id]
 */

const seasonId = parseInt(environment.season);
// console.log(`Building season ${seasonId}`);

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
*/
buildDrivers()
  .then(count => console.log(`Wrote ${count} drivers`))
  .then(() => buildCircuits())
  .then(numberOfCircuits => console.log('Circuits built', numberOfCircuits))
  .then(() => buildNewSeason(seasonId))
  .then(() => console.log('Season built'));

/*
*/
// buildCircuits().then(
//   () => buildNewSeason(seasonId))
//   .then(() => console.log('Season built'));
//buildLastYear(seasonId).then(() => console.log('Last year built'));
