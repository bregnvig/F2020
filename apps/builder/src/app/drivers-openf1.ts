// import { firestoreUtils } from '@f2020/data';
import { firestoreUtils } from './converter/firestore-utils';
import { IDriver, mapper } from '@f2020/data';
import { firebaseApp } from './firebase';
import { Driver } from '@f2020/openf1';
import { filterNullish, StringUtils, toMap } from '@f2020/tools';

export const getDrivers = async (sessionKey?: string): Promise<IDriver[]> => {
  const filter = sessionKey ? `?session_key=${sessionKey}` : '';
  return fetch(`https://api.openf1.org/v1/drivers${filter}`)
    .then(response => response.json())
    .then((response: Driver[]) => response.map(mapper.driver))
    .then(drivers => [...drivers.reduce(toMap('name'), new Map<string, IDriver>()).values()]);
};

export const buildDrivers = async (): Promise<number> => {
  const db = firebaseApp.database;
  const drivers = (await getDrivers())
    .filter(driver => !!driver.code && !!driver.countryCode);
  const driverCollection = db.collection('drivers');
  const existingDrivers = await driverCollection.get().then(snapshot => snapshot.docs.map(doc => doc.data()) as IDriver[]);
  const existingDriver = existingDrivers.reduce((acc, d) => ({ ...acc, [StringUtils.normalize(d.name)]: d }), {});

  return db.runTransaction(transaction => {
    drivers
      .forEach(driver => {
        const ergastDriver = existingDriver[StringUtils.normalize(driver.name)] ?? existingDrivers.find(d => d.permanentNumber === driver.permanentNumber && d.code === driver.code);
        const driverId = ergastDriver?.driverId ?? driver.driverId;
        console.log('Updating driver', driver.code, driverId, ergastDriver?.name, driver.headshotUrl);
        transaction.set(driverCollection.doc(driverId), filterNullish(firestoreUtils.convertTimestamps({ ...ergastDriver, ...driver, driverId })));
      });
    return Promise.resolve(drivers.length);
  });
};
