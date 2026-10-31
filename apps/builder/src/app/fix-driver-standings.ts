import { championshipPoints, IDriver, IDriverStanding, IRace } from '@f2020/data';
import { DriverChampionship, Lap, Session, SessionResult } from '@f2020/openf1';
import { DateTime } from 'luxon';
import { firebaseApp } from './firebase';
import { converter } from './converter';
import { cachedFetch } from './cached-fetch';
import { racesURL } from './season-ics';

export const fetchJson = <T>(url: string): Promise<T> => cachedFetch(url).then(r => r.json());

/**
 * Finds the session of the race weekend. A circuit can host more than one race a year, so the session
 * starting closest to the race start is picked.
 */
export const findSession = async (year: number, race: IRace, sessionName: 'Race' | 'Sprint' | 'Qualifying'): Promise<Session | undefined> => {
  // OpenF1 answers 404 when no session matches, e.g. a weekend without a sprint
  const sessions = await fetchJson<Session[]>(`https://api.openf1.org/v1/sessions?year=${year}&circuit_key=${race.circuitId}&session_name=${sessionName}`).catch(
    () => [] as Session[],
  );
  const distance = (s: Session) => Math.abs(DateTime.fromISO(s.date_start).diff(race.raceStart, 'days').days);
  return sessions.filter(s => distance(s) < 4).sort((a, b) => distance(a) - distance(b))[0];
};

export const getCompletedRaces = (seasonId: number): Promise<IRace[]> =>
  firebaseApp.database
    .collection(racesURL(seasonId))
    .withConverter(converter.race)
    .get()
    .then(snapshot => snapshot.docs.map(doc => doc.data() as IRace))
    .then(races => races.filter(r => r.state === 'completed').sort((a, b) => a.round - b.round));

const winnerNumber = async (session: Session | undefined): Promise<number | undefined> =>
  session
    ? fetchJson<SessionResult[]>(`https://api.openf1.org/v1/session_result?session_key=${session.session_key}`).then(results => results.find(r => r.position === 1)?.driver_number)
    : undefined;

/** The driver number with the fastest lap of the session */
const fastestLapNumber = async (session: Session): Promise<number | undefined> =>
  fetchJson<Lap[]>(`https://api.openf1.org/v1/laps?session_key=${session.session_key}`).then(
    laps => laps.filter(lap => typeof lap.lap_duration === 'number').sort((a, b) => a.lap_duration! - b.lap_duration!)[0]?.driver_number,
  );

interface Wins {
  /** Wins by driver id */
  wins: Map<string, number>;
  /** Fastest laps by driver id */
  fastestLaps: Map<string, number>;
  lastRaceSession: Session;
}

const raceSessionOf = async (seasonId: number, race: IRace): Promise<Session> => {
  const raceSession = await findSession(seasonId, race, 'Race');
  if (!raceSession) {
    throw new Error(`No OpenF1 race session for round ${race.round} ${race.name}`);
  }
  return raceSession;
};

const storedWins = async (seasonId: number, lastRace: IRace): Promise<Wins> => {
  const stored = await firebaseApp.database
    .doc(`seasons/${seasonId}/standings/all-drivers`)
    .get()
    .then(doc => (doc.data()?.standing ?? []) as IDriverStanding[]);
  if (!stored.length) {
    throw new Error(`No stored standing in season ${seasonId} to keep wins from. Run without --keep-wins`);
  }
  console.log(`Keeping wins of ${stored.length} drivers from Firestore`);
  return {
    wins: new Map(stored.map(s => [s.driver.driverId, s.wins] as const)),
    fastestLaps: new Map(stored.map(s => [s.driver.driverId, s.fastestLaps ?? 0] as const)),
    lastRaceSession: await raceSessionOf(seasonId, lastRace),
  };
};

/** The fastest laps of the races by driver id */
const countFastestLaps = async (seasonId: number, completedRaces: IRace[], findDriver: (driverNumber: number) => IDriver | undefined) => {
  const fastestLaps = new Map<string, number>();
  for (const race of completedRaces) {
    const driverNumber = await fastestLapNumber(await raceSessionOf(seasonId, race));
    const driverId = driverNumber === undefined ? undefined : findDriver(driverNumber)?.driverId;
    console.log(`Round ${race.round} ${race.name}: fastest lap ${driverId ?? driverNumber ?? 'none'}`);
    driverId && fastestLaps.set(driverId, (fastestLaps.get(driverId) ?? 0) + 1);
  }
  return fastestLaps;
};

const countWins = async (seasonId: number, completedRaces: IRace[], findDriver: (driverNumber: number) => IDriver | undefined): Promise<Wins> => {
  const wins = new Map<string, number>();
  let lastRaceSession: Session | undefined;
  for (const race of completedRaces) {
    const raceSession = await raceSessionOf(seasonId, race);
    const sprintSession = await findSession(seasonId, race, 'Sprint');
    const winners = [await winnerNumber(raceSession), await winnerNumber(sprintSession)].filter(n => n !== undefined);
    console.log(`Round ${race.round} ${race.name}: winners ${winners.map(n => findDriver(n)?.driverId ?? n).join(', ')}`);
    winners
      .map(n => findDriver(n)?.driverId)
      .filter(driverId => !!driverId)
      .forEach(driverId => wins.set(driverId, (wins.get(driverId) ?? 0) + 1));
    lastRaceSession = raceSession;
  }
  return { wins, fastestLaps: await countFastestLaps(seasonId, completedRaces, findDriver), lastRaceSession };
};

/**
 * Rebuilds seasons/{seasonId}/standings/all-drivers from OpenF1.
 *
 * Points and positions, current and before the weekend, are taken from the championship after the last completed race in Firestore. Wins are the number of
 * race and sprint wins in the completed races, the same way the result function counts them, and fastest laps are those of the races.
 * With `keepWins` the wins and fastest laps already in Firestore are kept, so only the last race is fetched from OpenF1.
 *
 * Nothing is written unless `write` is true.
 */
export const fixDriverStandings = async (seasonId: number, write: boolean, keepWins: boolean) => {
  const db = firebaseApp.database;
  const drivers = await db
    .collection('drivers')
    .get()
    .then(snapshot => snapshot.docs.map(doc => doc.data() as IDriver));
  const findDriver = (driverNumber: number) => drivers.find(d => d.activeNumber === driverNumber);

  const completedRaces = await getCompletedRaces(seasonId);
  if (!completedRaces.length) {
    console.log(`No completed races in season ${seasonId}`);
    return;
  }
  console.log(`Found ${completedRaces.length} completed races. Last is round ${completedRaces.at(-1).round} ${completedRaces.at(-1).name}`);

  const { wins, fastestLaps, lastRaceSession } = keepWins ? await storedWins(seasonId, completedRaces.at(-1)) : await countWins(seasonId, completedRaces, findDriver);

  const championship = await fetchJson<DriverChampionship[]>(`https://api.openf1.org/v1/championship_drivers?session_key=${lastRaceSession.session_key}`);
  const standing: IDriverStanding[] = championship
    .sort((a, b) => a.position_current - b.position_current)
    .map(c => {
      const driver = findDriver(c.driver_number);
      if (!driver) {
        console.warn(`No driver with number ${c.driver_number}. Skipped`);
      }
      return driver && { driver, ...championshipPoints(c), wins: wins.get(driver.driverId) ?? 0, fastestLaps: fastestLaps.get(driver.driverId) ?? 0 };
    })
    .filter(s => !!s);

  console.table(
    standing.map(s => ({
      driver: s.driver.driverId,
      position: s.position,
      points: s.points,
      previousPosition: s.previousPosition,
      previousPoints: s.previousPoints,
      wins: s.wins,
      fastestLaps: s.fastestLaps,
    })),
  );

  const path = `seasons/${seasonId}/standings/all-drivers`;
  if (write) {
    await db.doc(path).set({ standing });
    console.log(`Wrote ${standing.length} drivers to ${path}`);
  } else {
    console.log(`Dry run. Pass --write to write ${standing.length} drivers to ${path}`);
  }
};

/**
 * Counts the fastest laps of the completed races from OpenF1, and writes them to seasons/{seasonId}/standings/all-drivers.
 * Nothing else in the standing is changed. Nothing is written unless `write` is true.
 */
export const fixFastestLaps = async (seasonId: number, write: boolean) => {
  const db = firebaseApp.database;
  const path = `seasons/${seasonId}/standings/all-drivers`;
  const stored = await db
    .doc(path)
    .get()
    .then(doc => (doc.data()?.standing ?? []) as IDriverStanding[]);
  if (!stored.length) {
    throw new Error(`No stored standing in season ${seasonId}. Run --fix-driver-standings`);
  }
  const drivers = await db
    .collection('drivers')
    .get()
    .then(snapshot => snapshot.docs.map(doc => doc.data() as IDriver));
  const fastestLaps = await countFastestLaps(seasonId, await getCompletedRaces(seasonId), driverNumber => drivers.find(d => d.activeNumber === driverNumber));

  const standing = stored.map(s => ({ ...s, fastestLaps: fastestLaps.get(s.driver.driverId) ?? 0 }));
  console.table(standing.filter(s => s.fastestLaps).map(s => ({ driver: s.driver.driverId, fastestLaps: s.fastestLaps })));

  if (write) {
    await db.doc(path).update({ standing });
    console.log(`Wrote the fastest laps of ${standing.length} drivers to ${path}`);
  } else {
    console.log(`Dry run. Pass --write to write the fastest laps to ${path}`);
  }
};
