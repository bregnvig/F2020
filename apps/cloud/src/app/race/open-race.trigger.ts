import { IRace } from '@f2020/data';
import * as admin from 'firebase-admin';
import { Change, EventContext, region } from 'firebase-functions/v1';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { racesURL, seasonsURL, updateRace } from '../../lib';
;

const db = admin.firestore();

/**
 * This trigger opens the next race, when the previous completes.
 */
export const openRace = region('europe-west1').firestore.document('seasons/{seasonId}/races/{round}')
  .onUpdate(async (change: Change<DocumentSnapshot>, context: EventContext) => {
    const before: IRace = change.before.data() as IRace;
    const after: IRace = change.after.data() as IRace;
    if (before.state === 'closed' && after.state === 'completed') {
      const nextRace: IRace | null = await db.doc(`${seasonsURL}/${context.params.seasonId}/${racesURL}/${after.round + 1}`)
        .get()
        .then(snapshot => snapshot.exists ? snapshot.data() as IRace : null);

      if (nextRace) {
        console.log(`Opening ${nextRace.name}`);
        return updateRace(nextRace.season, nextRace.round, { state: 'open' });
      }
    }
    return Promise.resolve(true);
  });
