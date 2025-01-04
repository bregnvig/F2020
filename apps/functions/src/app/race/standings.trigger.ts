import { Circuit, finished, IDriver, IDriverRaceResult, IDriverResult, IDriverStanding, IQualifyResult, IRace, IRaceBasis, IRaceResult, mapper } from '@f2020/data';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { collectionPaths, currentSeason, documentPaths } from '../../lib';
import { requiredValue } from '@f2020/tools';
import { openF1, Session } from '@f2020/openf1';

/**
 * This trigger fetches the current standing for all drivers and for each driver.
 * For each driver both result and qualify.
 */
export const standingTrigger = onDocumentUpdated('seasons/{seasonId}/races/{round}', async event => {
  const before: IRace = event.data.before.data() as IRace;
  const after: IRace = event.data.after.data() as IRace;

  if (before.state !== 'completed' && after.state === 'completed') {
    const season = await currentSeason();
    await setDriver(season.id, after).then(results => setStandings(season.id, after, results));
  }
});

const setStandings = async (seasonId: string, race: IRace, results: IDriverRaceResult[]) => {
  const db = getFirestore();
  const allDrivers = await db.doc(documentPaths.standing.allDriver(seasonId)).get().then(doc => (doc.exists ? doc.data() : { standing: [] }) as { standing: IDriverStanding[] });
  const unchanged = allDrivers.standing.filter(({ driver }) => !results.some(r => r.driver.driverId === driver.driverId));
  const standing: IDriverStanding[] = results.map(r => {
    const previous = allDrivers.standing.find(({ driver }) => driver.driverId === r.driver.driverId);
    const pointsByRace = {
      ...previous?.pointsByRace,
      [race.circuitId]: r.points || 0,
    };
    const points = Object.values(pointsByRace).reduce((acc, p) => acc + p, 0);
    const wins = Object.values(pointsByRace).filter(p => p >= 25).length;
    return {
      driver: r.driver,
      pointsByRace,
      points,
      wins,
    };
  });
  return db.doc(documentPaths.standing.allDriver(seasonId)).set({ standing: [...unchanged, ...standing] });
};

const setDriver = async (seasonId: string, race: IRace) => {
  const db = getFirestore();

  const circuitId = requiredValue(race.circuitId, 'Race circuit id');
  const circuit = await db.doc(documentPaths.circuit(circuitId)).get().then(doc => doc.data() as Circuit);
  const drivers = await db.collection(collectionPaths.drivers()).get().then(snapshot => snapshot.docs.map(doc => doc.data() as IDriver));

  const raceSession = await openF1.api.session(seasonId, circuitId, 'Race');
  const qualifySession = await openF1.api.session(seasonId, circuitId, 'Qualifying');
  const basicRace = mapper.basisRace(circuit, race.round, seasonId);

  const buildResult = async (session: Session, mapperFnName: 'raceResult' | 'qualifyResult') => {
    const laps = await openF1.api.labs(session.session_key);
    const positions = await openF1.api.positions(session.session_key);
    return mapper[mapperFnName]({
      race: basicRace,
      laps,
      drivers,
      positions,
    });
  };
  const qualifyResult = await buildResult(qualifySession, 'qualifyResult') as IQualifyResult;
  const raceResult = await buildResult(raceSession, 'raceResult') as IRaceResult;
  return writeResult(qualifyResult, raceResult, basicRace);
};

const writeResult = async (qualifyResult: IQualifyResult, raceResult: IRaceResult, race: IRaceBasis) => {
  const db = getFirestore();
  const seasonId = race.season;
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
