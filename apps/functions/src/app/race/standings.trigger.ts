import { Circuit, IDriver, IDriverQualifying, IDriverRaceResult, IDriverStanding, IRace, mapper } from '@f2020/data';
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
  const db = getFirestore();
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

  const buildResult = async (session: Session, prop: 'races' | 'qualify', mapperFnName: 'raceResult' | 'qualifyResult') => {
    const laps = await openF1.api.labs(session.session_key);
    const positions = await openF1.api.positions(session.session_key);
    const basicRace = mapper.basisRace(circuit, race.round, seasonId);
    const result = mapper[mapperFnName]({
      race: basicRace,
      laps,
      drivers,
      positions,
    });
    return db.runTransaction(async transaction => {
      result.results.forEach((r: IDriverRaceResult | IDriverQualifying) => {
        transaction.set(
          db.doc(documentPaths.standing.driver(seasonId, seasonId, r.driver.driverId)),
          {
            [prop]:
              race.round === 1 ? [{ ...race, results: [r] }] : FieldValue.arrayUnion({ ...basicRace, results: [r] }),
          },
          { merge: true },
        );
      });
    }).then(() => result.results);
  };
  return buildResult(qualifySession, 'qualify', 'qualifyResult').then(() => buildResult(raceSession, 'races', 'raceResult') as Promise<IDriverRaceResult[]>);
};


