import { IRace } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { Change, logger, region } from 'firebase-functions/v1';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { collectionPaths, currentSeason, documentPaths, firestoreUtils } from '../../lib';
import { getDriverQualify, getDriverResults, getDriverStandings } from '../../lib/standing.service';

/**
 * This trigger fetches the current standing for all drivers and for each driver.
 * For each driver both result and qualify.
 */
export const standingTrigger = region('europe-west1').firestore.document('seasons/{seasonId}/races/{round}')
  .onUpdate(async (change: Change<DocumentSnapshot>) => {
    const db = getFirestore();
    const before: IRace = change.before.data() as IRace;
    const after: IRace = change.after.data() as IRace;

    if (before.state !== 'completed' || after.state === 'completed') {
      const season = await currentSeason();
      await setStandings(season.id);
      await setDriver(season.id);
      const previousSeasonId = parseInt(season.id) - 1 + '';
      const noPreviousYear = (await db.collection(collectionPaths.standings.drivers(season.id, previousSeasonId)).count().get()).data().count === 0;
      noPreviousYear && await setDriver(season.id, previousSeasonId);
    }
  });

const setStandings = async (seasonId: string) => {
  const db = getFirestore();
  const standing = await getDriverStandings(seasonId);
  db.doc(documentPaths.standing.allDriver(seasonId)).set({ standing });
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
