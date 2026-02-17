import { Circuit, finished, IDriver, IDriverRaceResult, IDriverResult, IDriverStanding, IRace, IRaceBasis, ITeam, mapper } from '@f2020/data';
import { requiredValue } from '@f2020/tools';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { collectionPaths, currentSeason, documentPaths, openF1Api } from '../../lib';
import { Session } from '@f2020/openf1';
import { logger } from 'firebase-functions';

interface WeekendInfo {
  token: string;
  seasonId: string;
  circuit: Circuit;
  drivers: IDriver[];
  raceSession: Session;
  qualifySession: Session;
  raceBasis: IRaceBasis;
}

const findDriverIdFn = (drivers: IDriverStanding[]) => (driverNumber: number): string => drivers.find(d => d.driver.activeNumber === driverNumber)?.driver.driverId;

/**
 * This trigger fetches the current standing for all drivers and for each driver.
 * For each driver both result and qualify.
 */
export const standingTrigger = onDocumentUpdated('seasons/{seasonId}/races/{round}', async event => {
  const before: IRace = event.data.before.data() as IRace;
  const after: IRace = event.data.after.data() as IRace;

  if (before.state !== 'completed' && after.state === 'completed') {
    const season = await currentSeason();
    const token = requiredValue(await openF1Api.token(), 'Token')?.access_token;
    const weekendInfo = await getWeekendInfo(token, season.id, after);
    await setDriverStatistics(weekendInfo)
      .then(results => setDriverStandings(token, season.id, after, results))
      .then(() => setTeamsStanding(weekendInfo));
  }
});

const setDriverStandings = async (token: string, seasonId: string, race: IRace, results: IDriverRaceResult[]) => {
  const db = getFirestore();
  const allDrivers = await db.doc(documentPaths.standing.allDriver(seasonId)).get().then(doc => (doc.exists ? doc.data() : { standing: [] }) as { standing: IDriverStanding[]; });
  const unchanged = allDrivers.standing.filter(({ driver }) => !results.some(r => r.driver.driverId === driver.driverId));
  const sprint = await sprintRace(token, seasonId, race.circuitId, allDrivers.standing);
  const standing: IDriverStanding[] = results.map(r => {
    const previous = allDrivers.standing.find(({ driver }) => driver.driverId === r.driver.driverId);
    const sprintPoints = sprint?.get(previous?.driver.driverId)?.points ?? 0;
    const sprintWin = (sprint?.get(previous?.driver.driverId)?.win ?? false) ? 1 : 0;
    const pointsByRace = {
      ...previous?.pointsByRace,
      [race.circuitId]: (r.points + sprintPoints) || 0,
    };
    const points = Object.values(pointsByRace).reduce((a, b) => a + b, 0);
    const wins = (previous?.wins ?? 0) + (r.points === 25 ? 1 : 0) + sprintWin;
    return {
      driver: r.driver,
      pointsByRace,
      points,
      wins,
    };
  });
  return db.doc(documentPaths.standing.allDriver(seasonId)).set({ standing: [...unchanged, ...standing] });
};

const setDriverStatistics = async (weekendInfo: WeekendInfo) => {
  const db = getFirestore();
  const { drivers, seasonId, raceBasis, qualifySession, raceSession, token } = weekendInfo;
  const race = weekendInfo.raceBasis;
  const gridPositions = mapper.grid({ positions: await openF1Api.startingGrid(token, qualifySession.session_key), drivers });
  const raceSessionResult = await openF1Api.sessionResults(token, raceSession.session_key);
  const qualifySessionResult = await openF1Api.sessionResults(token, qualifySession.session_key);
  const laps = await openF1Api.labs(token, raceSession.session_key);

  const qualifyResult = mapper.qualifyResult({ race: raceBasis, drivers, sessionResults: qualifySessionResult });
  const raceResult = mapper.raceResult({ race: raceBasis, drivers, gridPositions, laps, sessionResults: raceSessionResult });
  const currentResults: Map<string, IDriverResult> = await db.collection(collectionPaths.standings.drivers(seasonId, seasonId)).get().then(snapshot => {
    return snapshot.docs.map(doc => ({ driverId: doc.id, ...doc.data() as IDriverResult })).reduce((acc, r) => acc.set(r.driverId, r), new Map<string, IDriverResult>());
  });
  return db.runTransaction(async transaction => {
    raceResult.results.forEach((r: IDriverRaceResult) => {
      const current = currentResults.get(r.driver.driverId);
      const q = qualifyResult.results.find(qr => qr.driver.driverId === r.driver.driverId);
      const currentRaceResult = current?.races.find(r => r.round === race.round);
      const addRetirement = !finished(r.status) && finished(currentRaceResult?.results[0].status ?? 'Finished');
      const noOfRacesCompleted = (current?.races.length ?? 0) + 1;
      const averageFinishPosition = (
        (current?.races.filter(r => r !== currentRaceResult).reduce((acc, r) => acc + r.results[0].position, 0) ?? 0) +
        r.position
      ) / noOfRacesCompleted;
      const averageGridPosition = (
        (current?.races.filter(r => r !== currentRaceResult).reduce((acc, r) => acc + r.results[0].grid, 0) ?? 0) +
        r.grid
      ) / noOfRacesCompleted;
      transaction.set(
        db.doc(documentPaths.standing.driver(seasonId, seasonId, r.driver.driverId)),
        {
          races: race.round === 1 ? [{ ...race, results: [r] }] : FieldValue.arrayUnion({ ...race, results: [r] }),
          qualify: race.round === 1 ? [{ ...race, results: [q] }] : FieldValue.arrayUnion({ ...race, results: [q] }),
          retired: addRetirement ? (current?.retired ?? 0) + 1 : current?.retired ?? 0,
          averageFinishPosition,
          averageGridPosition,
        } as IDriverResult,
        { merge: true },
      );
    });
  }).then(() => raceResult.results);
};

const sprintRace = async (token: string, seasonId: string, circuitId: number, drivers: IDriverStanding[]): Promise<Map<string, { win: boolean, points: number; }> | undefined> => {
  const session = await openF1Api.session(token, seasonId, circuitId, 'Sprint');

  if (!session) return undefined;

  const positions = await openF1Api.sessionResults(token, session.session_key);

  const spritPoints = [8, 7, 6, 5, 4, 3, 2, 1];
  const findDriverId = findDriverIdFn(drivers);

  return positions.reduce((acc, p) => {
    return acc.set(findDriverId(p.driver_number), { points: spritPoints[p.position - 1] ?? 0, win: p.position === 1 });
  }, new Map<string, { win: boolean, points: number; }>());
};

const setTeamsStanding = async ({ raceSession, token, seasonId }: WeekendInfo) => {
  const standings = await openF1Api.championTeamsPoints(token, raceSession.session_key);

  const db = getFirestore();
  const teams = await db.collection(collectionPaths.teams(seasonId)).get().then(({ docs }) => docs.map(doc => doc.data() as ITeam));
  const nameToTeam = teams.reduce((acc, team) => {
    acc.set(team.name, team);
    team.previousNames?.forEach(name => acc.set(name, team));
    return acc;
  }, new Map<string, ITeam>());
  await db.runTransaction(async transaction => {
    standings.forEach(s => {
      const team = nameToTeam.get(s.team_name);
      if (!team) {
        logger.warn(`${s.team_name} does not exist`);
        return;
      }
      transaction.set(
        db.doc(documentPaths.team(team.constructorId)),
        {
          points: s.points_current,
        } as Partial<ITeam>,
        {
          merge: true,
        },
      );
    });
  });
};

const getWeekendInfo = async (token: string, seasonId: string, race: IRace): Promise<WeekendInfo> => {
  const db = getFirestore();

  const circuitId = requiredValue(race.circuitId, 'Race circuit id');
  const circuit = await db.doc(documentPaths.circuit(circuitId)).get().then(doc => doc.data() as Circuit);
  const drivers = await db.collection(collectionPaths.drivers()).get().then(snapshot => snapshot.docs.map(doc => doc.data() as IDriver));

  const raceSession = await openF1Api.session(token, seasonId, circuitId, 'Race');
  const qualifySession = await openF1Api.session(token, seasonId, circuitId, 'Qualifying');
  const raceBasis = mapper.basisRace(circuit, race.round, seasonId);

  return {
    token,
    circuit,
    drivers,
    raceSession,
    qualifySession,
    raceBasis,
    seasonId,
  };

};
