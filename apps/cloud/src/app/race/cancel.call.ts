import { Bid, IRace, Player } from '@f2020/data';
import { firestore } from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { log } from 'firebase-functions/logger';
import { region } from 'firebase-functions/v1';
import { DateTime } from 'luxon';
import { currentSeason, getBookie, getRaceByRound, internalError, logAndCreateError, racesURL, seasonsURL, sendNotification, transferInTransaction, validateAccess } from '../../lib';
;

export const cancelRace = region('europe-west1').https.onCall(async (round: string, context) => {
  return validateAccess(context.auth?.uid, 'admin')
    .then(() => doCancel(round))
    .catch(internalError);
});

const doCancel = async (round: string) => {
  const season = await currentSeason();
  const race = await getRaceByRound(round);
  const bookie = await getBookie();

  if (!season || !race) {
    throw logAndCreateError('not-found', 'Season or race', season?.name, race?.name);
  }

  const db = firestore();
  const bids: ({ id: string, bid: Bid; })[] = await db.collection(`${seasonsURL}/${race.season}/${racesURL}/${race.round}/bids`).get()
    .then(snapshot => snapshot.docs)
    .then(snapshots => snapshots.map(s => ({
      id: s.id,
      bid: s.data() as Bid
    })));


  return Promise.all([
    db.runTransaction(transaction => {
      bids.forEach(({ bid, id }) => {
        bid.submitted && transferInTransaction({
          date: DateTime.local(),
          amount: 20,
          message: `${race.name} er blevet aflyst`,
          to: bid.player.uid,
          from: bookie.uid,
          involved: [bookie.uid, bid.player.uid],
        }, transaction);
        log(`Deleting ${seasonsURL}/${race.season}/${racesURL}/${race.round}/bids/${id}`);

        transaction.delete(db.doc(`${seasonsURL}/${race.season}/${racesURL}/${race.round}/bids/${id}`));
      });
      transaction.update(db.doc(`${seasonsURL}/${race.season}/${racesURL}/${race.round}`), { state: 'cancelled', result: FieldValue.delete() });
      return Promise.resolve(`Rolled back result`);
    }),
    sendNotifications(race),
  ]);
};

const sendNotifications = async (race: IRace) => {
  const db = firestore();
  const players: Player[] = await db.collection(`players`)
    .where('receiveReminders', '==', true)
    .get()
    .then(snapshot => snapshot.docs.map(d => d.data() as Player))
    .then(players => players.filter(player => player.tokens?.length));
  return Promise.all(players.map(player => sendNotification(player.tokens, `${race.name} aflyst😥`, `${race.name} er blevet aflyst af FIA og der kan derfor ikke spilles på løbet`)));
};