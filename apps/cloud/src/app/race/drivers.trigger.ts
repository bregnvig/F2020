import { IRace } from '@f2020/data';
import { firestore } from 'firebase-admin';
import { Change, EventContext, region } from 'firebase-functions/v1';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { racesURL, seasonsURL } from './../../lib/collection-names';
;

const db = firestore();

/**
 * This trigger copies the drivers from the previous race to the new race.
 */
export const raceDrivers = region('europe-west1').firestore.document('seasons/{seasonId}/races/{round}')
  .onUpdate(async (change: Change<DocumentSnapshot>, context: EventContext) => {
    const before: IRace = change.before.data() as IRace;
    const after: IRace = change.after.data() as IRace;
    if (before.state === 'waiting' && after.state === 'open' && before.round !== 1) {
      const previousRace: IRace = await db.collection(`${seasonsURL}/${context.params.seasonId}/${racesURL}`)
        .where('state', '==', 'completed')
        .where('round', '<', before.round)
        .orderBy('round', 'desc')
        .get()
        .then(snapshot => snapshot.docs[0].data() as IRace);
      await db.doc(`${seasonsURL}/${context.params.seasonId}/${racesURL}/${context.params.round}`).update({ drivers: previousRace.drivers });
    }
    return Promise.resolve(true);
  });
