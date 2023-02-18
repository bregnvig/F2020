import { environment } from "./environments/environment";




const seasonId = parseInt(environment.season);
// getTeams(seasonId - 1)
//   .then(teams => writeTeams(seasonId, teams))
//   .then(count => console.log(`Wrote ${count} teams`));


// import { environment } from "./environments/environment";

// buildNewSeason(environment.season)
//   .then(() => assignTeamsToSeason(seasonId))
//   .then(_ => console.log('Completed', _))
//   .catch(error => console.error('Completed with errors', error));

// buildDrivers()
//   .then(count => console.log(`Wrote ${count} drivers`))
//   .catch(error => console.error('Completed with errors', error));
// Bare skriv de først ti ud
// readUser().then(transactions => console.log(transactions.slice(0, 10)));

// readUser().then(transactions => console.log(transactions.slice(0, 10000)));
// Bare skriv de først ti ud

// writeCollection('seasons/2020/teams').then(_ => JSON.stringify(_, null, '\t')).then(console.log)
// 

// appendRaces('2020').then(() => assignTeamsToSeason(2020))
//   .then(() => console.log('Done'));
// copyRace(8, 7).then(() => console.log('Copied race'));
// appendRaces('2021').then(_ => console.log('Added races', _));
//  assignTeamsToSeason(2023);

// buildPreviousRaceReult(seasonId - 1).then(() => console.log(`Build previous season`));