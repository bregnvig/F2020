// import { firestoreUtils } from '@f2020/data';
import { firestoreUtils } from './converter/firestore-utils';
import { getDrivers } from '@f2020/ergast-api';
import { mapper } from '@f2020/data';
import { firebaseApp } from './firebase';

export const buildDrivers = async (): Promise<number> => {
  const db = firebaseApp.datebase;
  const drivers = (await getDrivers())
    .filter(driver => !!driver.code)
    .map(mapper.driver);
  const driverCollection = db.collection('drivers');

  return db.runTransaction(transaction => {
    drivers
      .forEach(driver =>
        transaction.set(driverCollection.doc(driver.driverId), firestoreUtils.convertTimestamps(driver)),
      );
    return Promise.resolve(drivers.length);
  });
};


