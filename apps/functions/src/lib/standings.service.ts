import { championshipPoints, Circuit, driverQualifying, driverResult, IDriver, IDriverRaceResult, IDriverResult, IDriverStanding, IRace, IRaceBasis, ITeam, mapper } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { collectionPaths, documentPaths } from './paths';
import { openF1Api } from './openf1.api';
import { requiredValue } from '@f2020/tools';
import { Session } from '@f2020/openf1';
import { logger } from 'firebase-functions';
import { currentSeason } from './season.service';

interface WeekendInfo {
  token: string;
  seasonId: string;
  circuit: Circuit;
  drivers: IDriver[];
  raceSession: Session;
  qualifySession: Session;
  /** Missing on a weekend without a sprint */
  sprintSession?: Session;
  raceBasis: IRaceBasis;
}

const findDriverFn = (drivers: IDriver[]) =>
  (driverNumber: number): IDriver | undefined =>
    drivers.find(d => d.activeNumber === driverNumber);

export const setStandings = async (race: IRace) => {
  const season = await currentSeason();
  const token = requiredValue(await openF1Api.token(), 'Token')?.access_token;
  const weekendInfo = await getWeekendInfo(token, season.id, race);
  await setDriverStatistics(weekendInfo)
    .then(results => setDriverStandings(weekendInfo, race, results))
    .then(() => setTeamsStanding(token, season.id, weekendInfo.raceSession, weekendInfo.sprintSession));
};

/**
 * Updates the points and positions of the drivers and the teams after the sprint, before the race is done. The wins are kept,
 * as the sprint winner is counted with the race
 */
export const setSprintStandings = async (race: IRace) => {
  const season = await currentSeason();
  const token = requiredValue(await openF1Api.token(), 'Token')?.access_token;
  const circuitId = requiredValue(race.circuitId, 'Race circuit id');
  const sprintSession = requiredValue(await findSession(token, season.id, circuitId, 'Sprint'), `Sprint session of ${race.name}`);
  const drivers = await getDrivers();

  const db = getFirestore();
  const allDrivers = await db
    .doc(documentPaths.standing.allDriver(season.id))
    .get()
    .then(doc => (doc.exists ? doc.data() : { standing: [] }) as { standing: IDriverStanding[] });
  const championship = await driverStandings(token, sprintSession, drivers);
  const standing: IDriverStanding[] = championship.map(({ driver, ...points }) => ({
    driver,
    ...points,
    wins: allDrivers.standing.find(s => s.driver.driverId === driver.driverId)?.wins ?? 0,
  }));
  await db.doc(documentPaths.standing.allDriver(season.id)).set({ standing });
  await setTeamsStanding(token, season.id, sprintSession);
};

const setDriverStandings = async ({ token, seasonId, drivers, raceSession, sprintSession }: WeekendInfo, race: IRace, results: IDriverRaceResult[]) => {
  const db = getFirestore();
  const allDrivers = await db
    .doc(documentPaths.standing.allDriver(seasonId))
    .get()
    .then(doc => (doc.exists ? doc.data() : { standing: [] }) as { standing: IDriverStanding[] });
  const sprintWinner = await sprintRaceWinner(token, seasonId, race.circuitId, drivers);
  const raceWinner = results.find(r => r.position === 1)?.driver.driverId;
  const championship = await driverStandings(token, raceSession, drivers, sprintSession);
  const standing: IDriverStanding[] = championship.map(({ driver, ...points }) => {
    const previous = allDrivers.standing.find(s => s.driver.driverId === driver.driverId);
    const wins = (previous?.wins ?? 0) + (driver.driverId === sprintWinner ? 1 : 0) + (driver.driverId === raceWinner ? 1 : 0);
    return {
      driver,
      ...points,
      wins,
    };
  });
  return db.doc(documentPaths.standing.allDriver(seasonId)).set({ standing });
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
  const currentResults: Map<string, IDriverResult> = await db
    .collection(collectionPaths.standings.drivers(seasonId, seasonId))
    .get()
    .then(snapshot => {
      return snapshot.docs.map(doc => ({ driverId: doc.id, ...(doc.data() as IDriverResult) })).reduce((acc, r) => acc.set(r.driverId, r), new Map<string, IDriverResult>());
    });
  return db
    .runTransaction(async transaction => {
      raceResult.results.forEach((r: IDriverRaceResult) => {
        const current = currentResults.get(r.driver.driverId);
        // A re-run of the round replaces the stored result of that round
        const races = race.round === 1 ? [] : (current?.races ?? []).filter(cr => cr.round !== race.round);
        const qualify = race.round === 1 ? [] : (current?.qualify ?? []).filter(cq => cq.round !== race.round);
        transaction.set(
          db.doc(documentPaths.standing.driver(seasonId, seasonId, r.driver.driverId)),
          driverResult([...races, { ...race, results: [r] }], [...qualify, { ...race, results: [driverQualifying(qualifyResult, r.driver)] }]),
          { merge: true },
        );
      });
    })
    .then(() => raceResult.results);
};

const sprintRaceWinner = async (token: string, seasonId: string, circuitId: number, drivers: IDriver[]): Promise<string | undefined> => {
  const session = await findSession(token, seasonId, circuitId, 'Sprint');
  if (!session) return undefined;

  const results = await openF1Api.sessionResults(token, session.session_key);
  const winner = results.find(r => r.position === 1);

  return winner ? findDriverFn(drivers)(winner.driver_number)?.driverId : undefined;
};

type DriverPoints = Omit<IDriverStanding, 'wins'>;

/** OpenF1 answers 404 when there is no session, e.g. no sprint */
const findSession = async (token: string, seasonId: string, circuitId: number, sessionName: 'Race' | 'Qualifying' | 'Sprint'): Promise<Session | undefined> => {
  try {
    return await openF1Api.session(token, seasonId, circuitId, sessionName);
  } catch {
    return undefined;
  }
};

/** With a sprint session, the standing is compared with the standing before the sprint, so before the weekend */
const driverStandings = async (token: string, session: Session, drivers: IDriver[], sprintSession?: Session): Promise<DriverPoints[]> => {
  const positions = await openF1Api.championDriverPoints(token, session.session_key);
  const sprint = sprintSession && session.session_key !== sprintSession.session_key
    ? new Map((await openF1Api.championDriverPoints(token, sprintSession.session_key)).map(c => [c.driver_number, c]))
    : undefined;
  const findDriver = findDriverFn(drivers);

  return positions
    .map(p => ({ driver: findDriver(p.driver_number), championship: p }))
    .filter(({ driver, championship }) => {
      if (!driver) {
        logger.warn(`No driver with number ${championship.driver_number}`);
      }
      return !!driver;
    })
    .map(({ driver, championship }) => ({ driver, ...championshipPoints(championship, sprint?.get(championship.driver_number)) }));
};

const setTeamsStanding = async (token: string, seasonId: string, session: Session, sprintSession?: Session) => {
  const standings = await openF1Api.championTeamsPoints(token, session.session_key);
  const sprint = sprintSession && session.session_key !== sprintSession.session_key
    ? new Map((await openF1Api.championTeamsPoints(token, sprintSession.session_key)).map(c => [c.team_name, c]))
    : undefined;

  const db = getFirestore();
  const teams = await db
    .collection(collectionPaths.teams(seasonId))
    .get()
    .then(({ docs }) => docs.map(doc => doc.data() as ITeam));
  const nameToTeam = teams.reduce((acc, team) => {
    acc.set(team.name, team);
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
        db.doc(documentPaths.team(seasonId, team.constructorId)),
        championshipPoints(s, sprint?.get(s.team_name)) as Partial<ITeam>,
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
  const circuit = await db
    .doc(documentPaths.circuit(circuitId))
    .get()
    .then(doc => doc.data() as Circuit);
  const drivers = await getDrivers();

  const raceSession = await openF1Api.session(token, seasonId, circuitId, 'Race');
  const qualifySession = await openF1Api.session(token, seasonId, circuitId, 'Qualifying');
  const sprintSession = await findSession(token, seasonId, circuitId, 'Sprint');
  const raceBasis = mapper.basisRace(circuit, race.round, seasonId);

  return {
    token,
    circuit,
    drivers,
    raceSession,
    qualifySession,
    sprintSession,
    raceBasis,
    seasonId,
  };
};

const getDrivers = () => getFirestore()
  .collection(collectionPaths.drivers())
  .get()
  .then(snapshot => snapshot.docs.map(doc => doc.data() as IDriver));
