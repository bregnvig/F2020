import { Bid } from '@f2020/data';
import { firestore } from 'firebase-admin';
import { region } from 'firebase-functions/v1';
import { DateTime } from 'luxon';
import { calculateResult, currentSeason, getBookie, getRaceByRound, internalError, logAndCreateError, racesURL, seasonsURL, transferInTransaction, validateAccess } from '../../lib';
import { validateResult } from './../../lib/validate.service';
;
import admin = require('firebase-admin');

export const submitResult = region('europe-west1').https.onCall(async (data: { round: number, result: Bid; }, context) => {
  return validateAccess(context.auth?.uid, 'admin')
    .then(() => buildResult(data.round, data.result))
    .then(() => true)
    .catch(internalError);
});

const buildResult = async (ruond: number, result: Bid) => {
  const season = await currentSeason();
  const race = await getRaceByRound(ruond);
  const bookie = await getBookie();

  if (!season || !race) {
    throw logAndCreateError('not-found', 'Season or race', season?.name, race?.name);
  }

  if (race.state !== 'closed') {
    throw logAndCreateError('failed-precondition', 'Race must be closed before submitting result', race?.name);
  }

  validateResult(result, race);

  const db = firestore();
  const calculatedResults: Bid[] = await db.collection(`${seasonsURL}/${race.season}/${racesURL}/${race.round}/bids`).where('submitted', '==', true).get()
    .then(snapshot => snapshot.docs)
    .then(snapshots => snapshots.map(s => s.data()))
    .then(bids => bids.map(bid => calculateResult(bid as Bid, result)))
    .then(bids => bids.sort((a, b) => b.points! - a.points!));

  const winners = calculatedResults.filter(r => r.points! === calculatedResults[0].points!);
  const winningPrice = Math.floor(calculatedResults.length * 20 / winners.length);

  return db.runTransaction(transaction => {
    winners.forEach(winner => {
      transferInTransaction({
        date: DateTime.local(),
        amount: winningPrice,
        message: `Gevinst ${race.name}`,
        from: bookie.uid,
        to: winner.player!.uid,
        involved: [bookie.uid, winner.player!.uid],
      }, transaction);
    });
    calculatedResults.forEach(cr => {
      transaction.set(db.doc(`${seasonsURL}/${race.season}/${racesURL}/${race.round}/bids/${cr.player!.uid}`), cr);
    });
    transaction.update(db.doc(`${seasonsURL}/${race.season}/${racesURL}/${race.round}`), { state: 'completed', result });
    return Promise.resolve(`Result submitted`);
  });


};
