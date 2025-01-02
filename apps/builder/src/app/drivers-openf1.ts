// import { firestoreUtils } from '@f2020/data';
import { firestoreUtils } from './converter/firestore-utils';
import { IDriver, mapper } from '@f2020/data';
import { firebaseApp } from './firebase';
import { Driver } from '@f2020/openf1';
import { filterNullish, StringUtils } from '@f2020/tools';

export const getDrivers = async (sessionKey?: string): Promise<IDriver[]> => {
  const filter = sessionKey ? `?session_key=${sessionKey}` : '';
  return fetch(`https://api.openf1.org/v1/drivers${filter}`)
    .then(response => response.json())
    .then((response: Driver[]) => response.map(mapper.driver))
    .then(drivers => drivers.filter(driver => !!driver.code && (!!driver.countryCode || sessionKey)))
    .then(drivers => [...drivers.reduce((acc, driver) => {
      const existing = acc.get(driver.code);
      if (existing) {
        const permanentNumber = driver.permanentNumber[0];
        !existing.permanentNumber.includes(permanentNumber) && existing.permanentNumber.push(driver.permanentNumber[0]);
      } else {
        acc.set(driver.code, driver);
      }
      return acc;
    }, new Map<string, IDriver>()).values()]);
};

export const buildDrivers = async (): Promise<number> => {
  const db = firebaseApp.database;
  const drivers = (await getDrivers());
  const driverCollection = db.collection('drivers');
  const existingDrivers = await driverCollection.get().then(snapshot => snapshot.docs.map(doc => doc.data()) as IDriver[]);
  const existingDriver = existingDrivers.reduce((acc, d) => ({ ...acc, [StringUtils.normalize(d.name)]: d }), {});

  return db.runTransaction(transaction => {
    drivers
      .forEach(driver => {
        const existing = existingDriver[StringUtils.normalize(driver.name)] ?? existingDrivers.find(d => d.permanentNumber === driver.permanentNumber && d.code === driver.code);
        const driverId = existing?.driverId ?? driver.driverId;
        console.log('Updating driver', driver.code, driverId, driver.teamName, driver.headshotUrl);
        transaction.set(driverCollection.doc(driverId), filterNullish(firestoreUtils.convertTimestamps({ ...existing, ...driver, driverId })));
      });
    return Promise.resolve(drivers.length);
  });
};
