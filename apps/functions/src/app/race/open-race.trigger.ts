import { IRace, State } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { log } from 'firebase-functions/logger';
import { Change, region } from 'firebase-functions/v1';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { collectionPaths, converter, currentSeason, updateRace } from '../../lib';

/**
 * This trigger opens the next race, when the previous completes.
 * Since rollback we need to determine if we really should open the next race
 */
export const openRace = region('europe-west1').firestore.document('seasons/{seasonId}/races/{round}')
  .onUpdate(async (change: Change<DocumentSnapshot>) => {
    const before: IRace = change.before.data() as IRace;
    const after: IRace = change.after.data() as IRace;
    const requiredStateToOpenCancelled: State[] = ['open', 'closed'];
    const noOpenRaces = await currentSeason().then(season => getFirestore()
      .collection(collectionPaths.races(season.id!))
      .where('state', '==', 'open')
      .get()
      .then(snapshot => snapshot.empty));

    if ((noOpenRaces && before.state === 'closed' && after.state === 'completed') || (after.state === 'cancelled' && requiredStateToOpenCancelled.includes(before.state))) {

      return currentSeason().then(season => getFirestore()
        .collection(collectionPaths.races(season.id!))
        .where('state', '==', 'waiting')
        .where('round', '>=', after.round)
        .orderBy('round')
        .withConverter<IRace>(converter.timestamp)
        .get()
        .then(snapshot => snapshot.docs[0]?.data())
        .then(nextRace => {
          if (nextRace && nextRace.state === 'waiting') {
            log(`Opening ${nextRace.name}`);
            return updateRace(nextRace.season, nextRace.round, { state: 'open' });
          }
        }));
    }
  });
