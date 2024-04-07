import { Bid, Player } from '@f2020/data';
import { DocumentReference, getFirestore } from 'firebase-admin/firestore';
import { collectionPaths, currentSeason, documentPaths, getCurrentRace, sendNotification } from '../../lib';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

export const newBidTrigger = onDocumentCreated('seasons/{seasonId}/races/{raceId}/bids/{userId}', async event => {
  const bid: Partial<Bid> = event.data.data() as Partial<Bid>;

  const db = getFirestore();
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
