import { ISeason } from '@f2020/data';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { DateTime } from 'luxon';
import { currentSeason, documentPaths, getBookie, internalError, logAndCreateError, PlayerImpl, transferInTransaction, validateAccess } from '../../lib';
import { onCall } from 'firebase-functions/v2/https';

export const undoWBC = onCall(async request => {
  return validateAccess(request.auth?.uid, 'player')
    .then(player => undo(player))
    .then(() => true)
    .catch(internalError);
});

const undo = async (player: PlayerImpl) => {
  const season: ISeason = await currentSeason();

  if (season.wbc.latestWBCJoinDate < DateTime.local()) {
    throw logAndCreateError('failed-precondition', `It's too late to undo join WBC.`);
  }

  const participants: string[] = season.wbc?.participants ?? [];
  if (participants.includes(player.uid) === false) {
    throw logAndCreateError('failed-precondition', `${player.displayName} never joined WBC`);
  }

  const db = getFirestore();
  const bookie = await getBookie();
  const doc = db.doc(documentPaths.season(season.id));
  return db.runTransaction(transaction => {
    transaction.set(doc, {
      wbc: {
        participants: FieldValue.arrayRemove(player.uid),
      },
    }, { merge: true });
    transferInTransaction({
      date: DateTime.local(),
      amount: 100,
      message: `Fortrød deltagelse i WBC`,
      from: bookie.uid,
      to: player.uid,
      involved: [player.uid, bookie.uid],
    }, transaction);
    return Promise.resolve('WBC undone');
  });
};

