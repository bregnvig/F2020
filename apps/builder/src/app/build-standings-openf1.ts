import { firebaseApp } from './firebase';
import { IDriverQualifying, IDriverRaceResult, IQualifyResult, IRaceResult } from '@f2020/data';
import { requiredValue } from '@f2020/tools';
import { firestore } from 'firebase-admin';
import { buildResults } from './build-results';
import FieldValue = firestore.FieldValue;

export const buildStandings = async (seasonId: number, year: number) => {

  const db = firebaseApp.database;
  const raceResults = await buildResults(seasonId, year);
  let round = 1;
  await db.runTransaction(async transaction => {
    const writeProp = (race: IRaceResult | IQualifyResult, prop: 'races' | 'qualify') => {
      race.results.forEach((r: IDriverRaceResult | IDriverQualifying) => {
        const driverId = requiredValue(r.driver.driverId, 'DriverId');
        transaction.set(db.doc(`seasons/${seasonId}/standings/drivers/${year}/${driverId}`), {
            [prop]: round === 1 ? { ...race, results: [r] } : FieldValue.arrayUnion({ ...race, results: [r] }),
          },
          { merge: true },
        );
      });
    };
    raceResults.forEach(({ race, qualify }) => {
      writeProp(race, 'races');
      writeProp(qualify, 'qualify');
    });
  });

};
