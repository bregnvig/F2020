import { firebaseApp } from './firebase';
import { Circuit, IDriver, IDriverGridPosition, IQualifyResult, IRaceResult, mapper } from '@f2020/data';
import { GridPosition, Session } from '@f2020/openf1';
import { arrayUtils } from '@f2020/tools';
import { resolveCircuit } from './circuit.resolver';
import { resolveDriver } from './driver.resolver';
import { cachedFetch } from './cached-fetch';

interface Meeting {
  name: string;
  location: string;
  countryName: string;
  raceId: number;
  qualifyId: number;
  meetingKey: number;
  circuitKey: number;
}

export interface MeetingResult {
  meeting: Meeting;
  race: IRaceResult;
  qualify: IQualifyResult;
}

export const buildResults = async (seasonId: number, year: number): Promise<MeetingResult[]> => {
  const circuits = await firebaseApp.database.collection('circuits').get().then(snapshot => snapshot.docs.map(doc => doc.data() as Circuit));
  const drivers = await firebaseApp.database.collection('drivers').get().then(snapshot => snapshot.docs.map(doc => doc.data() as IDriver));
  const meetings: Meeting[] = await cachedFetch(`https://api.openf1.org/v1/sessions?year=${year}`)
    .then(r => r.json())
    .then((response: Session[]) => response.filter(({ session_name }) => ['Qualifying', 'Race'].includes(session_name)))
    .then(sessions => {
      console.log(`Got ${sessions.length} for season ${seasonId}, year: ${year}`);
      const map = sessions.reduce((acc, session) => {
        const race = acc.get(session.meeting_key) ?? ({
          meetingKey: session.meeting_key,
          name: session.circuit_short_name,
          location: session.location,
          countryName: session.country_name,
          circuitKey: session.circuit_key,
        } as Meeting);
        session.session_name === 'Race' ? (race.raceId = session.session_key) : (race.qualifyId = session.session_key);
        return acc.set(session.meeting_key, race);
      }, new Map<number, Meeting>());
      return [...map.values()];
    })
    .then(races => races.toSorted(arrayUtils.propertySort('meetingKey')));

  let round = 1;
  const buildResult = async (meeting: Meeting, round: number): Promise<MeetingResult> => {
    const raceLaps = await cachedFetch(`https://api.openf1.org/v1/laps?session_key=${meeting.raceId}`).then(r => r.json());
    const raceSessionResult = await cachedFetch(`https://api.openf1.org/v1/session_result?session_key=${meeting.raceId}`).then(r => r.json());
    const positions = await cachedFetch(`https://api.openf1.org/v1/starting_grid?session_key=${meeting.qualifyId}`).then(r => r.json()) as GridPosition[];

    const gridPositions = await positions.reduce(async (accPromise, p) => {
      const acc = await accPromise;
      return [...acc, {
        driver: await resolveDriver(drivers, p),
        grid: p.position,
      }];
    }, Promise.resolve([] as IDriverGridPosition[]));

    const qualifySessionResult = await cachedFetch(`https://api.openf1.org/v1/session_result?session_key=${meeting.qualifyId}`).then(r => r.json());
    const circuit = await resolveCircuit(meeting.name, meeting.location, circuits);
    const basisRace = mapper.basisRace(circuit, round++, seasonId);
    const raceResult = mapper.raceResult({
      drivers,
      laps: raceLaps,
      gridPositions,
      race: basisRace,
      sessionResults: raceSessionResult,
    });
    const qualifyResult = mapper.qualifyResult({
      drivers,
      race: basisRace,
      sessionResults: qualifySessionResult,
    });
    return new Promise(resolve => setTimeout(() => resolve({ meeting, race: raceResult, qualify: qualifyResult }), 500));
  };

  return meetings.reduce(async (accPromise, race) => {
    const acc = await accPromise;
    console.log(`Building results for`, race.name, race.qualifyId, race.raceId);
    return [...acc, await buildResult(race, round++)];
  }, Promise.resolve([] as MeetingResult[]));

};
