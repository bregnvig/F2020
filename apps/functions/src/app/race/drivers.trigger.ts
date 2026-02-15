import { IDriver, IRace, mapper } from '@f2020/data';
import { documentPaths, firestoreUtils, openF1Api } from '../../lib';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { filterNullish } from '@f2020/tools';
import { Driver } from '@f2020/openf1';
import { logger } from 'firebase-functions';

/**
 * This trigger updates the drivers collection with the latest driver information from OpenF1.
 */
export const updateDriversCollection = onDocumentUpdated('seasons/{seasonId}/races/{round}', async event => {
  const db = getFirestore();
  const before: IRace = event.data.before.data() as IRace;
  const after: IRace = event.data.after.data() as IRace;
  if (before.state === 'closed' && after.state === 'completed') {
    const token = await openF1Api.token();
    const drivers = (await openF1Api.drivers(token.access_token)
      .then((response: Driver[]) => response.map(mapper.driver))
      .then(drivers => drivers.filter(driver => {
        const result = !!driver.code && !!driver.countryCode;
        !result && logger.warn('Invalid driver', driver);
        return result;
      })));

    const driverCollection = db.collection('drivers').where(
      'driverId', 'in', drivers.map(d => d.driverId),
    );
    const existingDrivers = await driverCollection.get().then(snapshot => snapshot.docs.map(doc => doc.data()) as IDriver[]);
    const existingById = new Map(existingDrivers.map(d => [d.driverId, d]));

    return db.runTransaction(transaction => {
      drivers
        .forEach(driver => {
          const existing = existingById.get(driver.driverId);
          const driverId = existing?.driverId ?? driver.driverId;
          const driverNumber = driver.permanentNumbers[0];
          const permanentNumbers = existing?.permanentNumbers ?? [];
          !permanentNumbers.includes(driverNumber) && permanentNumbers.push(driverNumber);
          const activeNumber = driverNumber;
          logger.info('Updating driver', driver.code, driverId, driver.teamName, driver.headshotUrl, `#${activeNumber}`);
          transaction.set(db.doc(documentPaths.driver(driverId)), firestoreUtils.convertTimestamps({
            ...existing,
            ...filterNullish(driver),
            driverId,
            permanentNumbers,
            activeNumber,
          }));
        });
      return Promise.resolve(drivers.length);
    });
  }
  return Promise.resolve(true);
});
