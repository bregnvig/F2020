import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Bid, Player, sendMessage } from '../../lib';

export const newBidTrigger = functions.region('europe-west1').firestore.document('seasons/{seasonId}/races/{raceId}/bids/{userId}')
  .onCreate(async (snapshot: functions.firestore.DocumentSnapshot, context) => {
    const bid: Partial<Bid> = snapshot.data() as Partial<Bid>;

    const db = admin.firestore();
    const players: Player[] = await db.collection(`players`)
      .where('receiveReminders', '==', true)
      .get()
      .then(playerSnapshot => playerSnapshot.docs.map(d => d.data() as Player))
      .then(_players => _players.filter(p => p.tokens && p.tokens.length && p.uid !== bid.player?.uid));

    return Promise.all(players.map(p => sendMessage(p.tokens!, `🤓 Bud på vej!`, `${bid.player?.displayName} er ved at lave sit bud!`)));
  });    