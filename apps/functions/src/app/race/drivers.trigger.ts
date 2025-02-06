import { IDriver, IRace } from '@f2020/data';
import { collectionPaths, documentPaths } from '../../lib/paths';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

const getSelectedDriver = (countryCode: string, drivers: IDriver[]) => {
  const candidates = drivers.filter(d => d.countryCode === countryCode);
  return candidates[Math.floor(Math.random() * candidates.length)] ?? drivers[Math.floor(Math.random() * drivers.length)];
};
/**
 * This trigger copies the drivers from the previous race to the new race.
 * It also selects the selectedDriver
 */
export const raceDrivers = onDocumentUpdated('seasons/{seasonId}/races/{round}', async event => {
  const db = getFirestore();
  const before: IRace = event.data.before.data() as IRace;
  const after: IRace = event.data.after.data() as IRace;
  if (before.state === 'waiting' && after.state === 'open' && before.round !== 1) {
    const previousRace: IRace = await db.collection(collectionPaths.races(event.params.seasonId))
      .where('state', '==', 'completed')
      .where('round', '<', before.round)
      .orderBy('round', 'desc')
      .get()
      .then(snapshot => snapshot.docs[0].data() as IRace);

    const drivers = await db.collection(collectionPaths.drivers())
      .where('driverId', 'in', previousRace.drivers)
      .get().then(snapshot => snapshot.docs.map(doc => doc.data())) as IDriver[];

    await db.doc(documentPaths.race(event.params.seasonId, event.params.round)).update({
      drivers: previousRace.drivers,
      selectedDriver: getSelectedDriver(after.countryCode, drivers).driverId,
    });
  }
  return Promise.resolve(true);
});
