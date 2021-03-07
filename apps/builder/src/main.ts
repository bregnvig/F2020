
// getTeams(2020).then(teams => Array.from(teams.values()).map(t => firebaseApp.datebase.doc(`seasons/2020/teams/${t.constructorId}`).set(t)));

// getTeams(2020).then(teams => console.log(teams)))
// buildPreviousRaceReult(2019).then(_ => console.log(JSON.stringify(_, null, '\t')))

// buildNewSeason(environment.season)
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