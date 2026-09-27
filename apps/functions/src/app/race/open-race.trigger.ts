import { IDriver, IRace, ITeam, mapper, State } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { log } from 'firebase-functions/logger';
import { collectionPaths, converter, currentSeason, documentPaths, openF1Api, updateRace } from '../../lib';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { Driver } from '@f2020/openf1';

/**
 * This trigger opens the next race, when the previous completes.
 * Since rollback we need to determine if we really should open the next race
 */
export const openRace = onDocumentUpdated('seasons/{seasonId}/races/{round}', async event => {
  const before: IRace = event.data.before.data() as IRace;
  const after: IRace = event.data.after.data() as IRace;
  const requiredStateToOpenCancelled: State[] = ['open', 'closed'];
  const noOpenRaces = await currentSeason().then(season =>
    getFirestore()
      .collection(collectionPaths.races(season.id!))
      .where('state', '==', 'open')
      .get()
      .then(snapshot => snapshot.empty)
  );

  if ((noOpenRaces && before.state === 'closed' && after.state === 'completed') || (after.state === 'cancelled' && requiredStateToOpenCancelled.includes(before.state))) {
    return currentSeason().then(season =>
      getFirestore()
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
        })
    );
  }
});

const getSelectedDriver = (countryCode: string, drivers: IDriver[]) => {
  const candidates = drivers.filter(d => d.countryCode === countryCode);
  return candidates[Math.floor(Math.random() * candidates.length)] ?? drivers[Math.floor(Math.random() * drivers.length)];
};

const createRaceTeams = (drivers: IDriver[], teams: ITeam[]): ITeam[] => {
  const teamDrivers = Object.groupBy(drivers, d => d.teamName);
  return teams.map(t => ({
    ...t,
    previousDrivers: [],
    drivers: teamDrivers[t.name].map(d => d.driverId),
  }));
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
    const previousRace: IRace = await db
      .collection(collectionPaths.races(event.params.seasonId))
      .where('state', '==', 'completed')
      .where('round', '<', before.round)
      .orderBy('round', 'desc')
      .get()
      .then(snapshot => snapshot.docs[0].data() as IRace);
    const token = await openF1Api.token();
    const drivers = await openF1Api.drivers(token.access_token).then((response: Driver[]) => response.map(mapper.driver));

    const seasonTeams = await db
      .collection(collectionPaths.teams(after.season))
      .get()
      .then(snapshot => snapshot.docs.map(doc => doc.data() as ITeam));
    const teams = createRaceTeams(drivers, seasonTeams);
    let selectedTeam = teams[Math.floor(Math.random() * teams.length)];
    while (selectedTeam.constructorId === previousRace.selectedTeam.constructorId) {
      selectedTeam = teams[Math.floor(Math.random() * teams.length)];
    }
    await db.doc(documentPaths.race(event.params.seasonId, event.params.round)).update({
      drivers: drivers.map(({ driverId }) => driverId),
      teams,
      selectedDriver: getSelectedDriver(after.countryCode, drivers).driverId,
      selectedTeam,
    });
  }
  return Promise.resolve(true);
});
