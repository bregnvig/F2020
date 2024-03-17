import { Bid, Player } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { getCurrentRace } from './race.service';
import { collectionPaths } from './paths';


export const playerWithoutBid = async (): Promise<Player[]> => {


  const currentRace = await getCurrentRace('open');

  const db = getFirestore();
  const played: Set<string> = await db.collection(collectionPaths.bids(currentRace.season, currentRace.round))
    .where('submitted', '==', true)
    .get()
    .then(snapshot => snapshot.docs.map(d => d.data() as Bid))
    .then(bids => bids.map(b => b.player!.uid))
    .then((uids: string[]) => new Set<string>(uids));

  const players = await db.collection(collectionPaths.players())
    .where('roles', 'array-contains', 'player')
    .get()
    .then(snapshot => snapshot.docs.map(d => d.data() as Player));
  return players.filter(player => !played.has(player.uid) && player.receiveReminders !== false);
};
