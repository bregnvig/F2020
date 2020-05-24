import { WBCResult } from './../../lib/model/wbc.model';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { Bid, IRace, racesURL, seasonsURL, Player } from '../../lib';

const db = admin.firestore();
const wbcPoints = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
/**
 * The struture fo the WBC is:
 * seasons/{seasonId} wbc[] - {raceId}: {race, players[]}
 */
export const wbcPointsTrigger = functions.region('europe-west1').firestore.document('seasons/{seasonId}/races/{raceId}')
  .onUpdate(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
    const before: IRace = change.before.data() as IRace;
    const after: IRace = change.after.data() as IRace;
    if (before.state === 'closed' && after.state === 'completed') {
      const bids: Bid[] = await db.collection(`${seasonsURL}/${context.params.seasonId}/${racesURL}/${context.params.raceId}/bids`)
        .where('points', '>', 0)
        .orderBy('points', 'desc')
        .orderBy('polePositionTimeDiff', 'asc')
        .limit(10)
        .get()
        .then(snapshot => snapshot.docs.map(s => s.data() as Bid));
      await createWBCRace(after, bids, db.doc(`${seasonsURL}/${context.params.seasonId}`));
    }
    return Promise.resolve(true)
  });

const createWBCRace = async (race: IRace, bids: Bid[], ref: admin.firestore.DocumentReference) => {
  const entry: WBCResult = {
    raceName: race.name,
    raceId: race.location.country,
    countryCode: race.countryCode,
    players: bids.map((b, index) => ({
      player: {
        displayName: b.player?.displayName,
        photoURL: b.player?.photoURL ?? null,
        uid: b.player?.uid
      } as Player,
      points: wbcPoints[index]
    }))
  }
  bids.forEach((b, index) => {
    console.log(b.player?.displayName, 'Points', b.points, 'WBC', wbcPoints[index]);
  })
  return ref.set({
    wbc: admin.firestore.FieldValue.arrayUnion(entry)
  }, { merge: true })
}
