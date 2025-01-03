import { Circuit, IDriver, IDriverQualifying, IDriverRaceResult, IRace, mapper } from '@f2020/data';
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
    // TODO Update standing some other way
    const season = await currentSeason();
    await setDriver(season.id, after);
    /*
        await setStandings(season.id);
        const previousSeasonId = parseInt(season.id) - 1 + '';
        const noPreviousYear = (await db.collection(collectionPaths.standings.drivers(season.id, previousSeasonId)).count().get()).data().count === 0;
        noPreviousYear && await setDriver(season.id, previousSeasonId);
    */
  }
});

/*
const setStandings = async (seasonId: string) => {
  const db = getFirestore();
  const standing = await getDriverStandings(seasonId);
  await db.doc(documentPaths.standing.allDriver(seasonId)).set({ standing });
};

*/
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
              race.round === 1 ? { ...race, results: [r] } : FieldValue.arrayUnion({ ...basicRace, results: [r] }),
          },
          { merge: true },
        );
      });
    });
  };
  return buildResult(raceSession, 'races', 'raceResult').then(() => buildResult(qualifySession, 'qualify', 'qualifyResult'));
};


