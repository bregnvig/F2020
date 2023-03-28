import { ISeason } from '@f2020/data';
import { firestore } from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { region } from 'firebase-functions/v1';
import { DateTime } from 'luxon';
import { currentSeason, getBookie, internalError, logAndCreateError, PlayerImpl, seasonsURL, transferInTransaction, validateAccess } from '../../lib';
;

export const undoWBC = region('europe-west1').https.onCall(async (data: any, context) => {
  return validateAccess(context.auth?.uid, 'player')
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

  const db = firestore();
  const bookie = await getBookie();
  const doc = db.doc(`${seasonsURL}/${season.id}`);
  return db.runTransaction(transaction => {
    transaction.set(doc, {
      wbc: {
        participants: FieldValue.arrayRemove(player.uid)
      }
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

