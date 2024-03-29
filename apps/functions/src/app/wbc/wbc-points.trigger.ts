import { Bid, IRace, ISeason, Player, WBCResult } from '@f2020/data';
import { DocumentReference, getFirestore } from 'firebase-admin/firestore';
import { log } from 'firebase-functions/logger';
import { Change, EventContext, region } from 'firebase-functions/v1';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { collectionPaths, documentPaths, internalError } from '../../lib';

const wbcPoints = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
/**
 * The structure for the WBC is:
 * seasons/{seasonId} wbc[] - {round}: {race, players[]}
 */
export const wbcPointsTrigger = region('europe-west1').firestore.document('seasons/{seasonId}/races/{round}')
  .onUpdate(async (change: Change<DocumentSnapshot>, context: EventContext) => {
    const db = getFirestore();
    const before: IRace = change.before.data() as IRace;
    const after: IRace = change.after.data() as IRace;
    if (before.state === 'closed' && after.state === 'completed') {
      const bids: Bid[] = await db.collection(collectionPaths.bids(context.params.seasonId, context.params.round))
        .where('submitted', '==', true)
        .orderBy('points', 'desc')
        .orderBy('polePositionTimeDiff', 'asc')
        .get()
        .then(snapshot => snapshot.docs.map(s => s.data() as Bid));
      await createWBCRace(after, bids, db.doc(documentPaths.season(context.params.seasonId)));
    }
    return Promise.resolve(true);
  });

const createWBCRace = async (race: IRace, bids: Bid[], ref: DocumentReference) => {
  const result: WBCResult = {
    raceName: race.name,
    round: race.round,
    countryCode: race.countryCode,
    players: bids.map((bid, index) => ({
      player: {
        displayName: bid.player?.displayName,
        photoURL: bid.player?.photoURL ?? null,
        uid: bid.player?.uid,
        email: bid.player?.email,
        tokens: bid.player?.tokens ?? [],
      } as Player,
      points: bid.points && wbcPoints[index] || 0,
    })),
  };
  result.players.forEach((b, index) => log(b.player?.displayName, 'Points ', bids[index].points, 'WBC', wbcPoints[index]));

  ref.get()
    .then(doc => doc.data())
    .then((season: ISeason) => {
      const results = (season.wbc?.results ?? []).filter(r => r.round !== result.round);
      return [...results, result].sort((a, b) => a.round - b.round);
    })
    .then(results => ref.set({
      wbc: {
        results,
      },
    }, { merge: true }))
    .then(() => log(`WBC points distributed for ${race.name}`))
    .catch(internalError);
};
