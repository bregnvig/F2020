import { IRace } from '@f2020/data';
import { Change, EventContext, region } from 'firebase-functions/v1';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { collectionPaths, documentPaths } from '../../lib/paths';
import { getFirestore } from 'firebase-admin/firestore';


/**
 * This trigger copies the drivers from the previous race to the new race.
 */
export const raceDrivers = region('europe-west1').firestore.document('seasons/{seasonId}/races/{round}')
  .onUpdate(async (change: Change<DocumentSnapshot>, context: EventContext) => {
    const db = getFirestore();
    const before: IRace = change.before.data() as IRace;
    const after: IRace = change.after.data() as IRace;
    if (before.state === 'waiting' && after.state === 'open' && before.round !== 1) {
      const previousRace: IRace = await db.collection(collectionPaths.races(context.params.seasonId))
        .where('state', '==', 'completed')
        .where('round', '<', before.round)
        .orderBy('round', 'desc')
        .get()
        .then(snapshot => snapshot.docs[0].data() as IRace);
      await db.doc(documentPaths.race(context.params.seasonId, context.params.round)).update({ drivers: previousRace.drivers });
    }
    return Promise.resolve(true);
  });
