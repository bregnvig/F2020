// import { firestoreUtils } from '@f2020/data';
import { firestoreUtils } from './converter/firestore-utils';
import { IDriver, mapper } from '@f2020/data';
import { firebaseApp } from './firebase';
import { Driver } from '@f2020/openf1';
import { filterNullish, StringUtils } from '@f2020/tools';
import { cachedFetch } from './cached-fetch';

export const getDrivers = async (sessionKey?: string): Promise<IDriver[]> => {
  const filter = sessionKey ? `?session_key=${sessionKey}` : '';
  return cachedFetch(`https://api.openf1.org/v1/drivers${filter}`)
    .then(response => response.json())
    .then((response: Driver[]) => response.map(mapper.driver))
    .then(drivers => drivers.filter(driver => {
      const result = !!driver.code && (!!driver.countryCode || !!sessionKey);
      !result && console.log('Invalid driver', driver);
      return result;
    }))
    .then(drivers => [...drivers.reduce((acc, driver) => {
      const existing = acc.get(driver.code);
      if (existing) {
        const permanentNumber = driver.permanentNumbers[0];
        !existing.permanentNumbers.includes(permanentNumber) && existing.permanentNumbers.push(permanentNumber);
      }
      return acc.set(driver.code, { ...(existing ?? {}), ...filterNullish(driver), permanentNumbers: existing?.permanentNumbers ?? driver.permanentNumbers } as IDriver);
    }, new Map<string, IDriver>()).values()]);
};

export const buildDrivers = async (): Promise<number> => {
  const db = firebaseApp.database;
  const drivers = (await getDrivers());
  const activeDrivers = await getDrivers('latest');
  const activeDriverMap = new Map(activeDrivers.map(d => [d.driverId, d.permanentNumbers[0]]));

  const driverCollection = db.collection('drivers');
  const existingDrivers = await driverCollection.get().then(snapshot => snapshot.docs.map(doc => doc.data()) as IDriver[]);
  const existingDriver = existingDrivers.reduce((acc, d) => ({ ...acc, [StringUtils.normalize(d.name)]: d }), {});
  return db.runTransaction(transaction => {
    drivers
      .forEach(driver => {
        const existing = existingDriver[StringUtils.normalize(driver.name)] ?? existingDrivers.find(d => d.permanentNumbers === driver.permanentNumbers && d.code === driver.code);
        const driverId = existing?.driverId ?? driver.driverId;
        const activeNumber = activeDriverMap.get(driver.driverId);
        console.log(`${existing ? 'Updating' : 'Creating'}`, driver.code, driverId, driver.teamName, driver.headshotUrl, activeNumber != null ? `#${activeNumber}` : 'inactive');
        transaction.set(driverCollection.doc(driverId), filterNullish(firestoreUtils.convertTimestamps({ ...existing, ...driver, driverId, activeNumber })));
      });
    return Promise.resolve(drivers.length);
  });
};
