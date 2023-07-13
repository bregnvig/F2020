import { IRace } from '@f2020/data';
import { firestore } from 'firebase-admin';
import { Change, region } from 'firebase-functions/v1';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { currentSeason, firestoreUtils, seasonsURL } from '../../lib';
import { getDriverQualify, getDriverResults, getDriverStandings } from '../../lib/standing.service';

const db = firestore();

/**
 * This trigger opens the next race, when the previous completes.
 * Since rollback we need to determine if we really should open the next race
 */
export const standingTrigger = region('europe-west1').firestore.document('seasons/{seasonId}/races/{round}')
  .onUpdate(async (change: Change<DocumentSnapshot>) => {
    const before: IRace = change.before.data() as IRace;
    const after: IRace = change.after.data() as IRace;

    if (before.state !== 'completed' || after.state === 'completed') {
      const season = await currentSeason();
      setStandings(season.id);
      setDriver(season.id);
    }
  });

const setStandings = async (seasonId: string) => {
  const standing = await getDriverStandings('2023');
  db.doc(`${seasonsURL}/${seasonId}/standings/all-drivers`).set({ standing });
};

const setDriver = async (seasonId: string) => {
  const results = await getDriverResults(seasonId);
  const qualifies = await getDriverQualify(seasonId);
  return db.runTransaction(transaction => {
    results.forEach(({ driverId, result }) => {
      const doc = db.doc(`${seasonsURL}/${seasonId}/standings/${driverId}`);
      transaction.set(doc, firestoreUtils.convertDateTimes({
        ...result,
        qualify: qualifies[driverId]
      }));
    });
    return Promise.resolve('Drivers results updated');
  });
};
