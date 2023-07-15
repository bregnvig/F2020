import { IRace } from '@f2020/data';
import { firestore } from 'firebase-admin';
import { Change, logger, region } from 'firebase-functions/v1';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { currentSeason, firestoreUtils, seasonsURL } from '../../lib';
import { getDriverQualify, getDriverResults, getDriverStandings } from '../../lib/standing.service';

const db = firestore();

/**
 * This trigger fetches the current standing for all drivers and for each driver. 
 * For each driver both result and qualify.
 */
export const standingTrigger = region('europe-west1').firestore.document('seasons/{seasonId}/races/{round}')
  .onUpdate(async (change: Change<DocumentSnapshot>) => {
    const before: IRace = change.before.data() as IRace;
    const after: IRace = change.after.data() as IRace;

    if (before.state !== 'completed' || after.state === 'completed') {
      const season = await currentSeason();
      await setStandings(season.id);
      await setDriver(season.id);
      const noPreviousYear = (await db.collection(`${seasonsURL}/${season.id}/standings/drivers/previous`).count().get()).data().count === 0;
      noPreviousYear && await setDriver(season.id, parseInt(season.id) - 1 + '');
    }
  });

const setStandings = async (seasonId: string) => {
  const standing = await getDriverStandings(seasonId);
  db.doc(`${seasonsURL}/${seasonId}/standings/all-drivers`).set({ standing });
};

const setDriver = async (seasonId: string, resultSeasonId = seasonId) => {
  const results = await getDriverResults(seasonId);
  const qualifies = await getDriverQualify(seasonId);
  return db.runTransaction(transaction => {
    results.forEach(({ driverId, result }) => {
      const doc = db.doc(`${seasonsURL}/${seasonId}/standings/drivers/${resultSeasonId === seasonId ? 'current' : 'previous'}/${driverId}`);
      transaction.set(doc, firestoreUtils.convertDateTimes({
        ...result,
        qualify: qualifies[driverId]
      }));
    });
    logger.info(`Drivers results updated for ${resultSeasonId}`);
    return Promise.resolve('Drivers results updated');
  });
};
