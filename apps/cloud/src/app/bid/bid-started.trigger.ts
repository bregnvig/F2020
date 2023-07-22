import { Bid, Player } from '@f2020/data';
import { firestore } from 'firebase-admin';
import { DocumentReference } from 'firebase-admin/firestore';
import { region } from 'firebase-functions/v1';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { collectionPaths, currentSeason, documentPaths, getCurrentRace, sendNotification } from '../../lib';

;

export const newBidTrigger = region('europe-west1').firestore.document('seasons/{seasonId}/races/{raceId}/bids/{userId}')
  .onCreate(async (snapshot: DocumentSnapshot) => {
    const bid: Partial<Bid> = snapshot.data() as Partial<Bid>;

    const db = firestore();
    const hasTokens = (p: Player) => p.tokens && p.tokens.length;
    const notYourself = (p: Player) => p.uid !== bid.player?.uid;
    const wishToReceive = (p: Player) => !p.receiveBettingStarted || p.receiveBettingStarted.some(uid => uid === bid.player.uid);
    const allFilter = (p: Player) => [hasTokens, notYourself, wishToReceive].every(fn => fn(p));
    const players: Player[] = await db.collection(collectionPaths.players())
      .where('receiveReminders', '==', true)
      .get()
      .then(playerSnapshot => playerSnapshot.docs.map(d => d.data() as Player))
      .then(_players => _players.filter(allFilter));

    const season = await currentSeason();
    const race = await getCurrentRace('open');

    return Promise.all([
      ...players.map(p => sendNotification(p.tokens, `🥳 Bud på vej!`, `${bid.player?.displayName} er ved at lave sit bud!`)),
      db.runTransaction(transaction => {
        const doc = db.doc(documentPaths.participant(season.id, race.round, bid.player.uid)) as DocumentReference<{ player: Player, submitted: false; }>;
        transaction.set(doc, { player: bid.player, submitted: false });
        return Promise.resolve('Bid without data written');
      }),

    ]);
  });    
