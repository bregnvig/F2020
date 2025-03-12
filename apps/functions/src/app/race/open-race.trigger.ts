import { IDriver, IRace, ITeam, State } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { log } from 'firebase-functions/logger';
import { collectionPaths, converter, currentSeason, documentPaths, updateRace } from '../../lib';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

/**
 * This trigger opens the next race, when the previous completes.
 * Since rollback we need to determine if we really should open the next race
 */
export const openRace = onDocumentUpdated('seasons/{seasonId}/races/{round}', async event => {
  const before: IRace = event.data.before.data() as IRace;
  const after: IRace = event.data.after.data() as IRace;
  const requiredStateToOpenCancelled: State[] = ['open', 'closed'];
  const noOpenRaces = await currentSeason().then(season => getFirestore()
    .collection(collectionPaths.races(season.id!))
    .where('state', '==', 'open')
    .get()
    .then(snapshot => snapshot.empty));

  if ((noOpenRaces && before.state === 'closed' && after.state === 'completed') || (after.state === 'cancelled' && requiredStateToOpenCancelled.includes(before.state))) {

    return currentSeason().then(season => getFirestore()
      .collection(collectionPaths.races(season.id!))
      .where('state', '==', 'waiting')
      .where('round', '>=', after.round)
      .orderBy('round')
      .withConverter<IRace>(converter.timestamp)
      .get()
      .then(snapshot => snapshot.docs[0]?.data())
      .then(nextRace => {
        if (nextRace && nextRace.state === 'waiting') {
          log(`Opening ${nextRace.name}`);
          return updateRace(nextRace.season, nextRace.round, { state: 'open' });
        }
      }));
  }
});

const getSelectedDriver = (countryCode: string, drivers: IDriver[]) => {
  const candidates = drivers.filter(d => d.countryCode === countryCode);
  return candidates[Math.floor(Math.random() * candidates.length)] ?? drivers[Math.floor(Math.random() * drivers.length)];
};

/**
 * This trigger copies the drivers from the previous race to the new race and selects a new team and driver
 * It also selects the selectedDriver
 */
export const updateDriversSelectedTeamAndDriver = onDocumentUpdated('seasons/{seasonId}/races/{round}', async event => {
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

    const teams = await db.collection(collectionPaths.teams(after.season)).get().then(snapshot => snapshot.docs.map(doc => doc.data() as ITeam));
    let selectedTeam = teams[Math.floor(Math.random() * teams.length)];
    while (selectedTeam.constructorId === previousRace.selectedTeam.constructorId) {
      selectedTeam = teams[Math.floor(Math.random() * teams.length)];
    }
    selectedTeam.drivers = selectedTeam.drivers.filter(d => previousRace.drivers.includes(d));
    await db.doc(documentPaths.race(event.params.seasonId, event.params.round)).update({
      drivers: previousRace.drivers,
      selectedDriver: getSelectedDriver(after.countryCode, drivers).driverId,
      selectedTeam,
    });
  }
  return Promise.resolve(true);
});
