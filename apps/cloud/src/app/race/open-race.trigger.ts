import { IRace } from '@f2020/data';
import { firestore } from 'firebase-admin';
import { log } from 'firebase-functions/logger';
import { Change, EventContext, region } from 'firebase-functions/v1';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { racesURL, seasonsURL, updateRace } from '../../lib';
;

const db = firestore();

/**
 * This trigger opens the next race, when the previous completes.
 * Since rollback we need to determine if we really should open the next race
 */
export const openRace = region('europe-west1').firestore.document('seasons/{seasonId}/races/{round}')
  .onUpdate(async (change: Change<DocumentSnapshot>, context: EventContext) => {
    const before: IRace = change.before.data() as IRace;
    const after: IRace = change.after.data() as IRace;
    if (before.state === 'closed' && after.state === 'completed') {
      const nextRace: IRace | null = await db.doc(`${seasonsURL}/${context.params.seasonId}/${racesURL}/${after.round + 1}`)
        .get()
        .then(snapshot => snapshot.exists ? snapshot.data() as IRace : null);

      if (nextRace && nextRace.state === 'waiting') {
        log(`Opening ${nextRace.name}`);
        return updateRace(nextRace.season, nextRace.round, { state: 'open' });
      }
    }
    return Promise.resolve(true);
  });
