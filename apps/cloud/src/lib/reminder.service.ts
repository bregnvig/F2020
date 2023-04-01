import { Bid, Player } from "@f2020/data";
import { firestore } from "firebase-admin";
import { racesURL, seasonsURL } from '.';
import { playersURL } from './collection-names';
import { getCurrentRace } from './race.service';


export const playerWithoutBid = async (): Promise<Player[]> => {


  const currentRace = await getCurrentRace('open');

  const db = firestore();
  const played: Set<string> = await db.collection(`${seasonsURL}/${currentRace!.season}/${racesURL}/${currentRace?.round}/bids`)
    .where('submitted', '==', true)
    .get()
    .then(snapshot => snapshot.docs.map(d => d.data() as Bid))
    .then(bids => bids.map(b => b.player!.uid))
    .then((uids: string[]) => new Set<string>(uids));

  const players = await db.collection(`${playersURL}`)
    .where('roles', 'array-contains', 'player')
    .get()
    .then(snapshot => snapshot.docs.map(d => d.data() as Player));
  return players.filter(player => !played.has(player.uid) && player.receiveReminders !== false);
};