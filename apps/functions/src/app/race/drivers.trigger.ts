import { IDriver, IRace, mapper } from '@f2020/data';
import { documentPaths, firestoreUtils } from '../../lib';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { filterNullish, StringUtils } from '@f2020/tools';
import { Driver, openF1 } from '@f2020/openf1';
import { logger } from 'firebase-functions';

/**
 * This trigger updates the drivers collection with the latest driver information from OpenF1.
 */
export const updateDriversCollection = onDocumentUpdated('seasons/{seasonId}/races/{round}', async event => {
  const db = getFirestore();
  const before: IRace = event.data.before.data() as IRace;
  const after: IRace = event.data.after.data() as IRace;
  if (before.state === 'closed' && after.state === 'completed') {
    const drivers = (await openF1.api.drivers()
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
    const existingDriver = existingDrivers.reduce((acc, d) => ({ ...acc, [StringUtils.normalize(d.name)]: d }), {} as Record<string, IDriver>);

    return db.runTransaction(transaction => {
      drivers
        .forEach(driver => {
          const existing = existingDriver[StringUtils.normalize(driver.name)] ?? existingDrivers.find(d => d.permanentNumber === driver.permanentNumber && d.code === driver.code);
          const driverId = existing?.driverId ?? driver.driverId;
          logger.info('Updating driver', driver.code, driverId, driver.teamName, driver.headshotUrl);
          transaction.set(db.doc(documentPaths.driver(driverId)), filterNullish(firestoreUtils.convertTimestamps({ ...existing, ...driver, driverId })));
        });
      return Promise.resolve(drivers.length);
    });
  }
  return Promise.resolve(true);
});
