import { firebaseApp } from './firebase';
import { driverResult, IQualifyResult, IRaceResult } from '@f2020/data';
import { requiredValue } from '@f2020/tools';
import { buildResults } from './build-results';

/**
 * Builds the result of each driver in the year, e.g. last year. Each driver is written as a whole, and drivers who are not in the
 * results are deleted, so nothing is left from an earlier build. A dry run only logs it
 */
export const buildStandings = async (seasonId: number, year: number, write = true) => {
  const db = firebaseApp.database;
  const raceResults = await buildResults(seasonId, year);
  const standings = new Map<string, { races: IRaceResult[]; qualify: IQualifyResult[] }>();
  const standingOf = (driverId?: string) => {
    const id = requiredValue(driverId, 'DriverId');
    if (!standings.has(id)) {
      standings.set(id, { races: [], qualify: [] });
    }
    return standings.get(id)!;
  };
  raceResults.forEach(({ race, qualify }) => {
    race.results.forEach(result => standingOf(result.driver.driverId).races.push({ ...race, results: [result] }));
    qualify.results.forEach(result => standingOf(result.driver.driverId).qualify.push({ ...qualify, results: [result] }));
  });

  const collection = db.collection(`seasons/${seasonId}/standings/drivers/${year}`);
  const existing = await collection.listDocuments();
  standings.forEach(({ races, qualify }, driverId) => console.log(`${year} ${driverId}: ${races.length} races, ${qualify.length} qualifyings`));
  const deleted = existing.filter(doc => !standings.has(doc.id)).map(doc => doc.id);
  console.log(`${year}: ${standings.size} drivers. ${deleted.length ? `Deleting ${deleted.join(', ')}` : 'Nothing to delete'}`);
  if (!write) {
    console.log('Dry run, nothing written. Pass --write to write it');
    return;
  }
  await db.runTransaction(async transaction => {
    deleted.forEach(driverId => transaction.delete(collection.doc(driverId)));
    standings.forEach(({ races, qualify }, driverId) => transaction.set(collection.doc(driverId), driverResult(races, qualify)));
  });
};
