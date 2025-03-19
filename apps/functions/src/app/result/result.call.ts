import { Bid, calculateResult, validateResult } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { DateTime } from 'luxon';
import { collectionPaths, currentSeason, documentPaths, getBookie, getRaceByRound, internalError, logAndCreateError, transferInTransaction, validateAccess } from '../../lib';
import { CallableRequest, onCall } from 'firebase-functions/v2/https';
import { requiredValue } from '@f2020/tools';

export const submitResult = onCall(async (request: CallableRequest<{ round: number, result: Bid; }>) => {
  return validateAccess(request.auth?.uid, 'admin')
    .then(() => buildResult(request.data.round, request.data.result))
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

  try {
    validateResult(result, race);
  } catch (error) {
    throw logAndCreateError('failed-precondition', error.message);
  }

  const db = getFirestore();
  const calculatedResults: Bid[] = await db.collection(collectionPaths.bids(race.season, race.round)).where('submitted', '==', true).get()
    .then(snapshot => snapshot.docs)
    .then(snapshots => snapshots.map(s => s.data()))
    .then(bids => bids.map(bid => calculateResult(bid as Bid, result)))
    .then(bids => bids.sort((a, b) => (b.points ?? 0) - (a.points ?? 0)));

  const winners = calculatedResults.filter(r => (r.points ?? 0) === (calculatedResults[0].points ?? 0));
  const winningPrice = Math.floor(calculatedResults.length * 20 / winners.length);

  return db.runTransaction(transaction => {
    winners.forEach(winner => {
      const to = requiredValue(winner.player, 'Winner must have a player', winner);
      transferInTransaction({
        date: DateTime.local(),
        amount: winningPrice,
        message: `Gevinst ${race.name}`,
        from: bookie.uid,
        to: to.uid,
        involved: [bookie.uid, to.uid],
      }, transaction);
    });
    calculatedResults.forEach(cr => {
      transaction.set(db.doc(documentPaths.bid(race.season, race.round, cr.player.uid)), cr);
    });
    transaction.update(db.doc(documentPaths.race(race.season, race.round)), { state: 'completed', result });
    return Promise.resolve(`Result submitted`);
  });


};
