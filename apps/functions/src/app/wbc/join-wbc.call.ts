import { ISeason } from '@f2020/data';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { DateTime } from 'luxon';
import { documentPaths, getBookie, internalError, logAndCreateError, PlayerImpl, transferInTransaction, validateAccess } from '../../lib';
import { currentSeason } from './../../lib/season.service';
import { onCall } from 'firebase-functions/v2/https';

export const joinWBC = onCall(async request => {
  return validateAccess(request.auth?.uid, 'player')
    .then(player => join(player))
    .then(() => true)
    .catch(internalError);
});

const join = async (player: PlayerImpl) => {
  const season: ISeason = await currentSeason();

  if (season.wbc.latestWBCJoinDate < DateTime.local()) {
    throw logAndCreateError('failed-precondition', `It's too late to join WBC.`);
  }

  const participants: string[] = season.wbc?.participants ?? [];
  if (participants.includes(player.uid)) {
    throw logAndCreateError('failed-precondition', `${player.displayName} already joined WBC`);
  }

  if ((player.balance || 0) - 100 < -100) {
    throw logAndCreateError('failed-precondition', `${player.displayName} has insufficient funds. Balance: ${(player.balance || 0).toFixed(2)}`);
  }

  const db = getFirestore();
  const bookie = await getBookie();
  const doc = db.doc(documentPaths.season(season.id));
  return db.runTransaction(transaction => {
    transaction.set(doc, {
      wbc: {
        participants: FieldValue.arrayUnion(player.uid),
      },
    }, { merge: true });
    transferInTransaction({
      date: DateTime.local(),
      amount: 100,
      message: `Deltagelse WBC`,
      from: player.uid,
      to: bookie.uid,
      involved: [player.uid, bookie.uid],
    }, transaction);
    return Promise.resolve('WBC joined');
  });
};
