import { IRace, State } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { log } from 'firebase-functions/logger';
import { collectionPaths, converter, currentSeason, updateRace } from '../../lib';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

/**
 * This trigger opens the next race, when the previous completes.
 * Since rollback we need to determine if we really should open the next race
 */
export const openRace = onDocumentUpdated('seasons/{seasonId}/races/{round}', async event => {
  const before: IRace = event.data.before.data() as IRace;
  const after: IRace = event.data.after.data() as IRace;
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
