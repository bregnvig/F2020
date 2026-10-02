import { Circuit, driverResult, IDriver, IDriverRaceResult, IDriverResult, IDriverStanding, IRace, IRaceBasis, ITeam, mapper } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { collectionPaths, documentPaths } from './paths';
import { openF1Api } from './openf1.api';
import { isTruthy, requiredValue } from '@f2020/tools';
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
    .then(() => setTeamsStanding(weekendInfo));
};

const setDriverStandings = async ({ token, seasonId, drivers, raceSession }: WeekendInfo, race: IRace, results: IDriverRaceResult[]) => {
  const db = getFirestore();
  const allDrivers = await db
    .doc(documentPaths.standing.allDriver(seasonId))
    .get()
    .then(doc => (doc.exists ? doc.data() : { standing: [] }) as { standing: IDriverStanding[] });
  const sprintWinner = await sprintRaceWinner(token, seasonId, race.circuitId, drivers);
  const raceWinner = results.find(r => r.position === 1)?.driver.driverId;
  const championship = await driverStandings(token, raceSession, drivers);
  const standing: IDriverStanding[] = championship.map(({ driver, points }) => {
    const previous = allDrivers.standing.find(s => s.driver.driverId === driver.driverId);
    const wins = (previous?.wins ?? 0) + (driver.driverId === sprintWinner ? 1 : 0) + (driver.driverId === raceWinner ? 1 : 0);
    return {
      driver,
      points,
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
        const q = [qualifyResult.results.find(qr => qr.driver.driverId === r.driver.driverId)].filter(isTruthy);
        // A re-run of the round replaces the stored result of that round
        const races = race.round === 1 ? [] : (current?.races ?? []).filter(cr => cr.round !== race.round);
        const qualify = race.round === 1 ? [] : (current?.qualify ?? []).filter(cq => cq.round !== race.round);
        transaction.set(
          db.doc(documentPaths.standing.driver(seasonId, seasonId, r.driver.driverId)),
          driverResult([...races, { ...race, results: [r] }], [...qualify, { ...race, results: q }]),
          { merge: true },
        );
      });
    })
    .then(() => raceResult.results);
};

const sprintRaceWinner = async (token: string, seasonId: string, circuitId: number, drivers: IDriver[]): Promise<string | undefined> => {
  let session: Session = undefined;
  try {
    session = await openF1Api.session(token, seasonId, circuitId, 'Sprint');
  } catch {
    // Ignore
  }

  if (!session) return undefined;

  const results = await openF1Api.sessionResults(token, session.session_key);
  const winner = results.find(r => r.position === 1);

  return winner ? findDriverFn(drivers)(winner.driver_number)?.driverId : undefined;
};

const driverStandings = async (token: string, raceSession: Session, drivers: IDriver[]): Promise<{ driver: IDriver; points: number }[]> => {
  const positions = await openF1Api.championDriverPoints(token, raceSession.session_key);
  const findDriver = findDriverFn(drivers);

  return positions
    .map(p => ({ driver: findDriver(p.driver_number), points: p.points_current, driverNumber: p.driver_number }))
    .filter(({ driver, driverNumber }) => {
      if (!driver) {
        logger.warn(`No driver with number ${driverNumber}`);
      }
      return !!driver;
    })
    .map(({ driver, points }) => ({ driver, points }));
};

const setTeamsStanding = async ({ raceSession, token, seasonId }: WeekendInfo) => {
  const standings = await openF1Api.championTeamsPoints(token, raceSession.session_key);

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
  const circuit = await db
    .doc(documentPaths.circuit(circuitId))
    .get()
    .then(doc => doc.data() as Circuit);
  const drivers = await db
    .collection(collectionPaths.drivers())
    .get()
    .then(snapshot => snapshot.docs.map(doc => doc.data() as IDriver));

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
