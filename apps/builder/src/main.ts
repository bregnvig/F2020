import { writeDocument, writeCollection } from './app/write-document';
import { buildDrivers } from './app/drivers';
import { buildTransactions, buildTransactionsNullNegative, buildTransactionsNullPositive } from './app/transactions';
import { buildBalance } from './app/balance';
import { buildPreviousSeason, buildNewSeason } from './app/season';
import { environment } from './environments/environment';
// import { readUser } from './app/mysql/account';
import { Transaction } from './app/model/mysq.model';


buildNewSeason(environment.season)
  .then(_ => console.log('Completed', _))
  .catch(error => console.error('Completed with errors', error));
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

// writeCollection('seasons/2020/races/Azerbaijan/bids').then(console.log)
