import { ISeason } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { region } from 'firebase-functions/v1';
import { DateTime } from 'luxon';
import { documentPaths, getBookie, internalError, logAndCreateError, PlayerImpl, transferInTransaction, validateAccess } from '../../lib';
import { currentSeason } from './../../lib/season.service';

export const joinWBC = region('europe-west1').https.onCall(async (data: any, context) => {
  return validateAccess(context.auth?.uid, 'player')
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
