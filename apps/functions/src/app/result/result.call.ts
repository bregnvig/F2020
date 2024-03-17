import { Bid } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { region } from 'firebase-functions/v1';
import { DateTime } from 'luxon';
import {
  calculateResult,
  collectionPaths,
  currentSeason,
  documentPaths,
  getBookie,
  getRaceByRound,
  internalError,
  logAndCreateError,
  transferInTransaction,
  validateAccess,
} from '../../lib';
import { validateResult } from './../../lib/validate.service';

export const submitResult = region('europe-west1').https.onCall(async (data: { round: number, result: Bid; }, context) => {
  return validateAccess(context.auth?.uid, 'admin')
    .then(() => buildResult(data.round, data.result))
    .then(() => true)
    .catch(internalError);
});

const buildResult = async (round: number, result: Bid) => {
  const season = await currentSeason();
  const race = await getRaceByRound(round);
  const bookie = await getBookie();

  if (!season || !race) {
    throw logAndCreateError('not-found', 'Season or race', season?.name, race?.name);
  }

  if (race.state !== 'closed') {
    throw logAndCreateError('failed-precondition', 'Race must be closed before submitting result', race?.name);
  }

  validateResult(result, race);

  const db = getFirestore();
  const calculatedResults: Bid[] = await db.collection(collectionPaths.bids(race.season, race.round)).where('submitted', '==', true).get()
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
      transaction.set(db.doc(documentPaths.bid(race.season, race.round, cr.player.uid)), cr);
    });
    transaction.update(db.doc(documentPaths.race(race.season, race.round)), { state: 'completed', result });
    return Promise.resolve(`Result submitted`);
  });


};
