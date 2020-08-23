import { IRace } from './../../../functions/src/lib/model/race.model';
import { firebaseApp } from './app/firebase';
import { writeDocument, writeCollection } from './app/write-document';
import { buildDrivers } from './app/drivers';
import { buildTransactions, buildTransactionsNullNegative, buildTransactionsNullPositive } from './app/transactions';
import { buildBalance } from './app/balance';
import { buildPreviousSeason, buildNewSeason, appendRaces } from './app/season';
import { environment } from './environments/environment';
// import { readUser } from './app/mysql/account';
import { Transaction } from './app/model/mysq.model';
import { buildPreviousRaceReult } from './app/previous-year-race-result';
import { getTeams, assignTeamsToSeason } from './app/teams';
import { access } from 'fs';

// getTeams(2020).then(teams => Array.from(teams.values()).map(t => firebaseApp.datebase.doc(`seasons/2020/teams/${t.constructorId}`).set(t)));

// getTeams(2020).then(teams => console.log(teams)))
// buildPreviousRaceReult(2019).then(_ => console.log(JSON.stringify(_, null, '\t')))

// assignTeamsToSeason(2020).then(() => console.log('Done'));
// buildNewSeason(environment.season)
//   .then(_ => console.log('Completed', _))
//   .catch(error => console.error('Completed with errors', error));
// buildPreviousSeason(environment.season)
//   .then(() => console.log('Completed'))
//   .catch(error => console.error('Completed with errors', error));

// buildDrivers()
//   .then(count => console.log(`Wrote ${count} drivers`))
//   .catch(error => console.error('Completed with errors', error));
// Bare skriv de først ti ud
// readUser().then(transactions => console.log(transactions.slice(0, 10)));

/*
buildTransactionsNullNegative()
 .then(count => console.log(`Wrote ${count} transactions`))
 .catch(error => console.error('Completed with errors', error));
 buildTransactionsNullPositive()
 .then(count => console.log(`Wrote ${count} transactions`))
 .catch(error => console.error('Completed with errors', error));
buildTransactions()
.then(count => console.log(`Wrote ${count} transactions`))
.catch(error => console.error('Completed with errors', error));
*/
/*
buildBalance(8)
 .then(count => console.log(`Updated${count} players`))
 .catch(error => console.error('Completed with errors', error));
*/
// readUser().then(transactions => console.log(transactions.slice(0, 10000)));
// Bare skriv de først ti ud

// writeCollection('seasons/2020/teams').then(_ => JSON.stringify(_, null, '\t')).then(console.log)
// 

// appendRaces('2020')