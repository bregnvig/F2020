// import { firestoreUtils } from '@f2020/data';
import { firestoreUtils } from './converter/firestore-utils';
import { IDriver, mapper } from '@f2020/data';
import { firebaseApp } from './firebase';
import { Driver } from '@f2020/openf1';
import { toRecord } from '@f2020/tools';

const getDrivers = async () => {
  return fetch('https://api.openf1.org/v1/drivers').then(
    (response: Driver[]) => response.map(mapper.driver),
  );
};

export const buildDrivers = async (): Promise<number> => {
  const db = firebaseApp.database;
  const drivers = (await getDrivers())
    .filter(driver => !!driver.code);
  const driverCollection = db.collection('drivers');
  const existingDrivers = await driverCollection.get().then(snapshot => snapshot.docs.map(doc => doc.data()) as IDriver[]);
  const existingDriver = toRecord(existingDrivers, 'code');

  
  return db.runTransaction(transaction => {
    drivers
      .forEach(driver =>
        transaction.set(driverCollection.doc(driver.driverId), firestoreUtils.convertTimestamps(driver)),
      );
    return Promise.resolve(drivers.length);
  });
};


