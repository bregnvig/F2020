import { Bid, Participant } from '@f2020/data';
import { DocumentReference, getFirestore } from 'firebase-admin/firestore';
import { region } from 'firebase-functions/v1';
import { DateTime } from 'luxon';
import { currentSeason, firestoreUtils, getBookie, getCurrentRace, internalError, logAndCreateError, PlayerImpl, validateAccess } from '../../lib';
import { documentPaths } from '../../lib/paths';
import { validateBid } from '../../lib/validate.service';
import { transferInTransaction } from './../../lib/transactions.service';

const validateBalance = (player: PlayerImpl): void => {
  if ((player.balance || 0) - 20 < -100) {
    throw logAndCreateError('failed-precondition', `${player.displayName} has insufficient funds. Balance: ${(player.balance || 0).toFixed(2)}`);
  }
};

export const submitBid = region('europe-west1').https.onCall(async (data: Bid, context) => {
  return validateAccess(context.auth?.uid, 'player')
    .then(player => buildBid(player, data))
    .then(() => true)
    .catch(internalError);
});

const buildBid = async (player: PlayerImpl, bid: Bid) => {

  const season = await currentSeason();
  const race = await getCurrentRace('open');
  const bookie = await getBookie();


  if (!season || !race) {
    throw logAndCreateError('failed-precondition', 'Missing season or race', season?.name, race?.name);
  }

  if (!bid) {
    throw logAndCreateError('not-found', `No bid exists for uid: ${player.uid} for race ${race.round}`);
  }

  if (player.uid !== bid.player?.uid) {
    throw logAndCreateError('permission-denied', `${player.uid} tried to submit bid for ${bid.player?.displayName}, ${bid.player?.uid}`);
  }

  const db = getFirestore();
  validateBid(bid, race);
  validateBalance(player);

  const bidDoc = db.doc(documentPaths.bid(season.id, race.round, player.uid)) as DocumentReference<Bid>;
  const participantDoc = db.doc(documentPaths.participant(season.id, race.round, player.uid)) as DocumentReference<Participant>;
  return db.runTransaction(transaction => {
    transaction.set(bidDoc, firestoreUtils.convertDateTimes({ ...bid, submitted: true }), { merge: true });
    transaction.set(participantDoc, firestoreUtils.convertDateTimes({ submitted: true }), { merge: true });
    transferInTransaction({
      date: DateTime.local(),
      amount: 20,
      message: `Deltagelse i ${race.name}`,
      from: player.uid,
      to: bookie.uid,
      involved: [player.uid, bookie.uid],
    }, transaction);
    return Promise.resolve('Bid submitted');
  });

};
