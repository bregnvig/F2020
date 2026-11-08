import { IDriver } from '@f2020/data';
import { firebaseApp } from './firebase';

/**
 * Drivers who will drive before OpenF1 has them, e.g. a driver replacing another mid season. The driver id is the acronym in lower
 * case, as OpenF1 will have it, so `updateDriversCollection` updates the same driver after the race instead of adding another.
 */
const manualDrivers: IDriver[] = [
  {
    driverId: 'cam',
    code: 'CAM',
    name: 'Rafael Câmara',
    countryCode: 'BR',
    permanentNumbers: [51],
    activeNumber: 51,
    teamName: 'Haas F1 Team',
    teamColor: '9C9FA2',
  },
];

/**
 * Adds the drivers that aren't in the drivers collection. Existing drivers are left alone, as they may have been updated from OpenF1.
 *
 * Nothing is written unless `write` is true.
 */
export const addDrivers = async (write: boolean) => {
  const collection = firebaseApp.database.collection('drivers');
  const missing = await Promise.all(manualDrivers.map(driver => collection.doc(driver.driverId).get())).then(snapshots =>
    manualDrivers.filter((_, index) => !snapshots[index].exists),
  );

  manualDrivers.filter(driver => !missing.includes(driver)).forEach(driver => console.log(`${driver.name} (${driver.driverId}) exists`));
  missing.forEach(driver => console.log(`Adding ${driver.name} (${driver.driverId}) #${driver.activeNumber} ${driver.teamName}`));

  if (!write) {
    console.log('Dry run. Nothing written. Run with --write to update Firestore.');
    return;
  }
  const batch = firebaseApp.database.batch();
  missing.forEach(driver => batch.set(collection.doc(driver.driverId), driver));
  await batch.commit();
  console.log(`Added ${missing.length} drivers`);
};
