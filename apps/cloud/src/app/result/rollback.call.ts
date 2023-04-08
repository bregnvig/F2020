import { Bid } from '@f2020/data';
import { firestore } from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { region } from 'firebase-functions/v1';
import { DateTime } from 'luxon';
import { currentSeason, getBookie, getRaceByRound, internalError, logAndCreateError, racesURL, seasonsURL, transferInTransaction, validateAccess } from '../../lib';
;
import admin = require('firebase-admin');

const resetPoints = (bid: Bid): Bid => {
  const properties: (keyof Bid)[] = [
    'qualifyPoints',
    'fastestDriverPoints',
    'firstCrashPoints',
    'podiumPoints',
    'points',
    'polePositionTimeDiff'
  ];
  return Object.fromEntries(Object.entries(bid).filter(([key]) => !properties.includes(key as keyof Bid))) as Bid;
};

export const rollbackResult = region('europe-west1').https.onCall(async (round: string, context) => {
  return validateAccess(context.auth?.uid, 'admin')
    .then(() => buildRollback(round))
    .catch(internalError);
});

const buildRollback = async (round: string) => {
  const season = await currentSeason();
  const race = await getRaceByRound(round);
  const bookie = await getBookie();

  if (!season || !race) {
    throw logAndCreateError('not-found', 'Season or race', season?.name, race?.name);
  }

  const db = firestore();
  const bids: Bid[] = await db.collection(`${seasonsURL}/${race.season}/${racesURL}/${race.round}/bids`).where('submitted', '==', true).get()
    .then(snapshot => snapshot.docs)
    .then(snapshots => snapshots.map(s => s.data() as Bid))
    .then(bids => bids.sort((a, b) => b.points - a.points));
  // .then(bids => bids.map(resetPoints));

  const winnerPoints = bids[0].points;
  const winners = bids.filter(b => b.points === winnerPoints);
  const winningPrice = Math.floor(bids.length * 20 / winners.length);

  return db.runTransaction(transaction => {
    winners.forEach(winner => {
      transferInTransaction({
        date: DateTime.local(),
        amount: winningPrice,
        message: `${race.name} resultatet rullet tilbage`,
        to: bookie.uid,
        from: winner.player.uid,
        involved: [winner.player.uid, bookie.uid],
      }, transaction);
    });
    bids.map(resetPoints).forEach(withOutPoints => {
      transaction.set(db.doc(`${seasonsURL}/${race.season}/${racesURL}/${race.round}/bids/${withOutPoints.player.uid}`), withOutPoints);
    });
    transaction.update(db.doc(`${seasonsURL}/${race.season}/${racesURL}/${race.round}`), { state: 'closed', result: FieldValue.delete() });
    return Promise.resolve(`Rolled back result`);
  });


};
