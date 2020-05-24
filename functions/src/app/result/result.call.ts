import { validateResult } from './../../lib/validate.service';
import * as functions from 'firebase-functions';
import { internalError, validateAccess, Bid, logAndCreateError, seasonsURL, racesURL, currentSeason, getCurrentRace, getBookie, calculateResult, transferInTransaction } from '../../lib';
import admin = require('firebase-admin');
import { DateTime } from 'luxon';

export const submitResult = functions.region('europe-west1').https.onCall(async (data: Bid, context) => {
  return validateAccess(context.auth?.uid, 'admin')
    .then(player => buildResult(data))
    .then(() => true)
    .catch(internalError);
});

const buildResult = async (result: Bid) => {
  const season = await currentSeason();
  const race = await getCurrentRace('closed');
  const bookie = await getBookie();

  if (!season || !race) {
    throw logAndCreateError('not-found', 'Season or race', season?.name, race?.name);
  }

  validateResult(result, race);

  const db = admin.firestore();
  const calculatedResults: Bid[] = await db.collection(`${seasonsURL}/${race.season}/${racesURL}/${race.location.country}/bids`).where('submitted', '==', true).get()
    .then(snapshot => snapshot.docs)
    .then(snapshots => snapshots.map(s => s.data()))
    .then(bids => bids.map(bid => calculateResult(bid as Bid, result)))
    .then(bids => bids.sort((a, b) => b.points! - a.points!));

  const winners = calculatedResults.filter(r => r.points! === calculatedResults[0].points!);
  const winningPrice = Math.floor(calculatedResults.length * 20 / winners.length);

  // TODO WBC

  return db.runTransaction(transaction => {
    winners.forEach(winner => {
      transferInTransaction({
        date: DateTime.local(),
        amount: winningPrice,
        message: `Gevinst ${race.name}`,
        from: bookie.uid,
        to: winner.player!.uid
      }, transaction);
    });
    calculatedResults.forEach(cr => {
      transaction.set(db.doc(`${seasonsURL}/${race.season}/${racesURL}/${race.location.country}/bids/${cr.player!.uid}`), cr);
    });
    transaction.update(db.doc(`${seasonsURL}/${race.season}/${racesURL}/${race.location.country}`), { state: 'completed', result })
    return Promise.resolve(`Result submitted`);
  });


}
