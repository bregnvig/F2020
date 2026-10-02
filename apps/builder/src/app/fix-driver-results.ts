import { Circuit, driverQualifying, driverResult, IDriver, IDriverResult, IQualifyResult, IRace, IRaceResult, mapper } from '@f2020/data';
import { GridPosition, Lap, SessionResult } from '@f2020/openf1';
import { firebaseApp } from './firebase';
import { converter } from './converter';
import { racesURL } from './season-ics';
import { fetchJson, findSession } from './fix-driver-standings';

type DriverRounds = Pick<IDriverResult, 'races' | 'qualify'>;

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * The result function used to append rounds with arrayUnion, so a re-run round could be stored twice. The last one wins.
 */
const uniqueRounds = <T extends { round: number }>(items: T[]): T[] =>
  [...items.reduce((acc, item) => acc.set(item.round, item), new Map<number, T>()).values()].sort((a, b) => a.round - b.round);

// OpenF1 answers 404 when a session has no data, e.g. no starting grid
const fetchList = <T>(url: string): Promise<T[]> => fetchJson<T[]>(url).catch(() => [] as T[]);

/**
 * Maps the race and qualifying of every completed race in Firestore from OpenF1, the same way the result function does.
 */
const reloadFromOpenF1 = async (seasonId: number): Promise<Map<string, DriverRounds>> => {
  const db = firebaseApp.database;
  const drivers = await db.collection('drivers').get().then(snapshot => snapshot.docs.map(doc => doc.data() as IDriver));
  const completedRaces = await db.collection(racesURL(seasonId)).withConverter(converter.race).get()
    .then(snapshot => snapshot.docs.map(doc => doc.data() as IRace))
    .then(races => races.filter(r => r.state === 'completed').sort((a, b) => a.round - b.round));
  console.log(`Reloading ${completedRaces.length} completed races from OpenF1`);

  const byDriver = new Map<string, DriverRounds>();
  for (const race of completedRaces) {
    const raceSession = await findSession(seasonId, race, 'Race');
    if (!raceSession) {
      throw new Error(`No OpenF1 race session for round ${race.round} ${race.name}`);
    }
    const qualifySession = await findSession(seasonId, race, 'Qualifying');
    if (!qualifySession) {
      console.warn(`No OpenF1 qualifying session for round ${race.round} ${race.name}. Grid falls back to the finishing position`);
    }
    const circuit = await db.doc(`circuits/${race.circuitId}`).get().then(doc => doc.data() as Circuit);
    const basis = mapper.basisRace(circuit, race.round, seasonId);
    const gridPositions = qualifySession
      ? mapper.grid({ positions: await fetchList<GridPosition>(`https://api.openf1.org/v1/starting_grid?session_key=${qualifySession.session_key}`), drivers })
      : [];
    const raceResult = mapper.raceResult({
      race: basis,
      drivers,
      gridPositions,
      laps: await fetchList<Lap>(`https://api.openf1.org/v1/laps?session_key=${raceSession.session_key}`),
      sessionResults: await fetchList<SessionResult>(`https://api.openf1.org/v1/session_result?session_key=${raceSession.session_key}`),
    });
    const qualifyResult = qualifySession
      ? mapper.qualifyResult({
          race: basis,
          drivers,
          sessionResults: await fetchList<SessionResult>(`https://api.openf1.org/v1/session_result?session_key=${qualifySession.session_key}`),
        })
      : { ...basis, results: [] };
    console.log(`Round ${race.round} ${race.name}: ${raceResult.results.length} results`);

    raceResult.results.forEach(r => {
      const current = byDriver.get(r.driver.driverId) ?? { races: [], qualify: [] };
      byDriver.set(r.driver.driverId, {
        races: [...current.races, { ...basis, results: [r] } as IRaceResult],
        qualify: [...current.qualify, { ...basis, results: [driverQualifying(qualifyResult, r.driver)] } as IQualifyResult],
      });
    });
  }
  return byDriver;
};

/**
 * Recalculates seasons/{seasonId}/standings/drivers/{seasonId}/{driverId}: retired and the average positions.
 *
 * Without `reload`, the races and qualifyings already stored on each document are used, with duplicated rounds removed.
 * With `reload`, they are mapped again from OpenF1 for every completed race in Firestore.
 *
 * Nothing is written unless `write` is true.
 */
export const fixDriverResults = async (seasonId: number, write: boolean, reload: boolean) => {
  const db = firebaseApp.database;
  const path = `seasons/${seasonId}/standings/drivers/${seasonId}`;
  const currentResults = await db.collection(path).get()
    .then(snapshot => new Map(snapshot.docs.map(doc => [doc.id, doc.data() as IDriverResult])));

  const rounds: Map<string, DriverRounds> = reload
    ? await reloadFromOpenF1(seasonId)
    : new Map([...currentResults].map(([driverId, current]) => [driverId, { races: uniqueRounds(current.races ?? []), qualify: uniqueRounds(current.qualify ?? []) }]));
  if (!rounds.size) {
    console.log(`No driver results for ${path}`);
    return;
  }
  [...currentResults.keys()].filter(driverId => !rounds.has(driverId)).forEach(driverId => console.warn(`${driverId} has no results in OpenF1. Left untouched`));

  const fixed = [...rounds].map(([driverId, { races, qualify }]) => ({ driverId, current: currentResults.get(driverId), result: driverResult(races, qualify) }));

  console.table(
    fixed.map(({ driverId, current, result }) => ({
      driver: driverId,
      races: `${current?.races?.length ?? 0} → ${result.races.length}`,
      retired: `${current?.retired ?? 0} → ${result.retired}`,
      averageFinish: `${round(current?.averageFinishPosition ?? 0)} → ${round(result.averageFinishPosition)}`,
      averageGrid: `${round(current?.averageGridPosition ?? 0)} → ${round(result.averageGridPosition)}`,
    })),
  );

  if (write) {
    const batch = db.batch();
    fixed.forEach(({ driverId, result }) => batch.set(db.doc(`${path}/${driverId}`), result, { merge: true }));
    await batch.commit();
    console.log(`Wrote ${fixed.length} driver results to ${path}`);
  } else {
    console.log(`Dry run. Pass --write to write ${fixed.length} driver results to ${path}`);
  }
};
