import { IRace } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

/**
 * This trigger fetches the current standing for all drivers and for each driver.
 * For each driver both result and qualify.
 */
export const standingTrigger = onDocumentUpdated('seasons/{seasonId}/races/{round}', async event => {
  const db = getFirestore();
  const before: IRace = event.data.before.data() as IRace;
  const after: IRace = event.data.after.data() as IRace;

  if (before.state !== 'completed' && after.state === 'completed') {
    // TODO Update standing some other way
    /*
        const season = await currentSeason();
        await setStandings(season.id);
        await setDriver(season.id);
        const previousSeasonId = parseInt(season.id) - 1 + '';
        const noPreviousYear = (await db.collection(collectionPaths.standings.drivers(season.id, previousSeasonId)).count().get()).data().count === 0;
        noPreviousYear && await setDriver(season.id, previousSeasonId);
    */
  }
});

/*
const setStandings = async (seasonId: string) => {
  const db = getFirestore();
  const standing = await getDriverStandings(seasonId);
  await db.doc(documentPaths.standing.allDriver(seasonId)).set({ standing });
};

const setDriver = async (seasonId: string, resultSeasonId = seasonId) => {
  const db = getFirestore();
  const results = await getDriverResults(resultSeasonId);
  const qualifies = await getDriverQualify(resultSeasonId);
  return db.runTransaction(transaction => {
    results.forEach(({ driverId, result }) => {
      const doc = db.doc(documentPaths.standing.driver(seasonId, resultSeasonId, driverId));
      transaction.set(doc, firestoreUtils.convertDateTimes({
        ...result,
        qualify: qualifies[driverId],
      }));
    });
    logger.info(`Drivers results updated for ${resultSeasonId}`);
    return Promise.resolve('Drivers results updated');
  });
};
*/
