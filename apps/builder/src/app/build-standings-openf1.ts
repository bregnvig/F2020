import { firebaseApp } from './firebase';
import { Circuit, IDriver, mapper } from '@f2020/data';
import { Session } from '@f2020/openf1';
import { propertySort } from '@f2020/tools';
import { firestore } from 'firebase-admin';
import FieldValue = firestore.FieldValue;

export const buildStandings = async (seasonId: number) => {

  const circuits = await firebaseApp.database.collection('circuits').get().then(snapshot => snapshot.docs.map(doc => doc.data() as Circuit));
  const drivers = await firebaseApp.database.collection('drivers').get().then(snapshot => snapshot.docs.map(doc => doc.data() as IDriver));

  await build(seasonId, 'Qualifying', 'qualify', circuits, drivers);
  await build(seasonId, 'Race', 'races', circuits, drivers);
};


const build = async (seasonId: number, sessionName: string, prop: 'races' | 'qualify', circuits: Circuit[], drivers: IDriver[]) => {
  const races: Session[] = await fetch(`https://api.openf1.org/v1/sessions?session_name=${sessionName}&year=${seasonId}`)
    .then(r => r.json())
    .then((response: Session[]) => response.toSorted(propertySort('meeting_key')))
    .then((response: Session[]) => response.slice(0, 3));

  const db = firebaseApp.database;
  const buildResult = async (session: Session, round: number) => {
    const laps = await fetch(`https://api.openf1.org/v1/laps?session_key=${session.session_key}`).then(r => r.json());
    const positions = await fetch(`https://api.openf1.org/v1/position?session_key=${session.session_key}`).then(r => r.json());

    const circuit = circuits.find(c => c.circuitId === session.circuit_key);
    const race = mapper.basisRace(circuit, round++, seasonId);
    const result = mapper.raceResult({
      race,
      laps,
      drivers,
      positions,
    });
    await db.runTransaction(async transaction => {
      result.results.forEach(r => transaction.set(
        db.doc(`seasons/${seasonId}/standings/drivers/${seasonId}/${r.driver.driverId}`),
        {
          [prop]:
            round === 1 ? { ...race, results: [r] } : FieldValue.arrayUnion({ ...race, results: [r] }),
        },
        { merge: true },
      ));
    });
    return new Promise(resolve => setTimeout(() => resolve(undefined), 500));
  };

  let round = 1;
  while (races.length) {
    const session = races.shift();
    console.log(`Building ${prop}`, session.circuit_short_name);
    await buildResult(session, round++);
  }
};
