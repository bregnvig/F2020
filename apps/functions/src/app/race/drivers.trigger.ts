import { IRace } from '@f2020/data';
import { collectionPaths, documentPaths } from '../../lib/paths';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';


/**
 * This trigger copies the drivers from the previous race to the new race.
 */
export const raceDrivers = onDocumentUpdated('seasons/{seasonId}/races/{round}', async event => {
  const db = getFirestore();
  const before: IRace = event.data.before.data() as IRace;
  const after: IRace = event.data.after.data() as IRace;
  if (before.state === 'waiting' && after.state === 'open' && before.round !== 1) {
    const previousRace: IRace = await db.collection(collectionPaths.races(event.params.seasonId))
      .where('state', '==', 'completed')
      .where('round', '<', before.round)
      .orderBy('round', 'desc')
      .get()
      .then(snapshot => snapshot.docs[0].data() as IRace);
    await db.doc(documentPaths.race(event.params.seasonId, event.params.round)).update({ drivers: previousRace.drivers });
  }
  return Promise.resolve(true);
});
