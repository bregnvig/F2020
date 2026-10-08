import { championshipPoints, IDriver, IDriverStanding, IRace } from '@f2020/data';
import { DriverChampionship, Session, SessionResult } from '@f2020/openf1';
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
  const sessions = await fetchJson<Session[]>(`https://api.openf1.org/v1/sessions?year=${year}&circuit_key=${race.circuitId}&session_name=${sessionName}`)
    .catch(() => [] as Session[]);
  const distance = (s: Session) => Math.abs(DateTime.fromISO(s.date_start).diff(race.raceStart, 'days').days);
  return sessions
    .filter(s => distance(s) < 4)
    .sort((a, b) => distance(a) - distance(b))[0];
};

export const getCompletedRaces = (seasonId: number): Promise<IRace[]> => firebaseApp.database
  .collection(racesURL(seasonId)).withConverter(converter.race).get()
  .then(snapshot => snapshot.docs.map(doc => doc.data() as IRace))
  .then(races => races.filter(r => r.state === 'completed').sort((a, b) => a.round - b.round));

const winnerNumber = async (session: Session | undefined): Promise<number | undefined> => session
  ? fetchJson<SessionResult[]>(`https://api.openf1.org/v1/session_result?session_key=${session.session_key}`)
    .then(results => results.find(r => r.position === 1)?.driver_number)
  : undefined;

interface Wins {
  /** Wins by driver id */
  wins: Map<string, number>;
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
  const stored = await firebaseApp.database.doc(`seasons/${seasonId}/standings/all-drivers`).get()
    .then(doc => (doc.data()?.standing ?? []) as IDriverStanding[]);
  if (!stored.length) {
    throw new Error(`No stored standing in season ${seasonId} to keep wins from. Run without --keep-wins`);
  }
  console.log(`Keeping wins of ${stored.length} drivers from Firestore`);
  return {
    wins: new Map(stored.map(s => [s.driver.driverId, s.wins] as const)),
    lastRaceSession: await raceSessionOf(seasonId, lastRace),
  };
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
  return { wins, lastRaceSession };
};

/**
 * Rebuilds seasons/{seasonId}/standings/all-drivers from OpenF1.
 *
 * Points and positions, current and before the weekend, are taken from the championship after the last completed race in Firestore. Wins are the number of
 * race and sprint wins in the completed races, the same way the result function counts them. With `keepWins` the wins already in
 * Firestore are kept, so only the last race is fetched from OpenF1.
 *
 * Nothing is written unless `write` is true.
 */
export const fixDriverStandings = async (seasonId: number, write: boolean, keepWins: boolean) => {
  const db = firebaseApp.database;
  const drivers = await db.collection('drivers').get().then(snapshot => snapshot.docs.map(doc => doc.data() as IDriver));
  const findDriver = (driverNumber: number) => drivers.find(d => d.activeNumber === driverNumber);

  const completedRaces = await getCompletedRaces(seasonId);
  if (!completedRaces.length) {
    console.log(`No completed races in season ${seasonId}`);
    return;
  }
  console.log(`Found ${completedRaces.length} completed races. Last is round ${completedRaces.at(-1).round} ${completedRaces.at(-1).name}`);

  const { wins, lastRaceSession } = keepWins
    ? await storedWins(seasonId, completedRaces.at(-1))
    : await countWins(seasonId, completedRaces, findDriver);

  const championship = await fetchJson<DriverChampionship[]>(`https://api.openf1.org/v1/championship_drivers?session_key=${lastRaceSession.session_key}`);
  const standing: IDriverStanding[] = championship
    .sort((a, b) => a.position_current - b.position_current)
    .map(c => {
      const driver = findDriver(c.driver_number);
      if (!driver) {
        console.warn(`No driver with number ${c.driver_number}. Skipped`);
      }
      return driver && { driver, ...championshipPoints(c), wins: wins.get(driver.driverId) ?? 0 };
    })
    .filter(s => !!s);

  console.table(standing.map(s => ({
    driver: s.driver.driverId,
    position: s.position,
    points: s.points,
    previousPosition: s.previousPosition,
    previousPoints: s.previousPoints,
    wins: s.wins,
  })));

  const path = `seasons/${seasonId}/standings/all-drivers`;
  if (write) {
    await db.doc(path).set({ standing });
    console.log(`Wrote ${standing.length} drivers to ${path}`);
  } else {
    console.log(`Dry run. Pass --write to write ${standing.length} drivers to ${path}`);
  }
};
