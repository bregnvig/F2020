import { firebaseApp } from './firebase';
import { Circuit, IDriver, IDriverGridPosition, IQualifyResult, IRaceResult, mapper } from '@f2020/data';
import { Driver, GridPosition, openF1Url, Session } from '@f2020/openf1';
import { arrayUtils } from '@f2020/tools';
import { resolveCircuit } from './circuit.resolver';
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

/**
 * The drivers of the session, with the number each had then. The results only have the number, and a number can belong to another
 * driver in a later season, e.g. 1 is the number of the champion. A driver who is not in the drivers collection is taken from OpenF1
 */
const sessionDrivers = async (drivers: IDriver[], sessionKey: number): Promise<IDriver[]> => {
  const openF1Drivers: Driver[] = await cachedFetch(openF1Url.driver(sessionKey)).then(r => r.json());
  return openF1Drivers.map(openF1Driver => {
    const driver = mapper.driver(openF1Driver);
    const known = drivers.find(d => d.driverId === driver.driverId) ?? drivers.find(d => d.code === driver.code);
    return { ...(known ?? driver), permanentNumbers: [openF1Driver.driver_number], activeNumber: openF1Driver.driver_number };
  });
};

export const buildResults = async (seasonId: number, year: number): Promise<MeetingResult[]> => {
  const circuits = await firebaseApp.database
    .collection('circuits')
    .get()
    .then(snapshot => snapshot.docs.map(doc => doc.data() as Circuit));
  const drivers = await firebaseApp.database
    .collection('drivers')
    .get()
    .then(snapshot => snapshot.docs.map(doc => doc.data() as IDriver));
  const meetings: Meeting[] = await cachedFetch(`https://api.openf1.org/v1/sessions?year=${year}`)
    .then(r => r.json())
    .then((response: Session[]) => response.filter(({ session_name }) => ['Qualifying', 'Race'].includes(session_name)))
    .then(sessions => {
      console.log(`Got ${sessions.length} for season ${seasonId}, year: ${year}`);
      const map = sessions.reduce((acc, session) => {
        const race =
          acc.get(session.meeting_key) ??
          ({
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
    const positions = (await cachedFetch(`https://api.openf1.org/v1/starting_grid?session_key=${meeting.qualifyId}`).then(r => r.json())) as GridPosition[];
    const raceDrivers = await sessionDrivers(drivers, meeting.raceId);
    const qualifyDrivers = await sessionDrivers(drivers, meeting.qualifyId);

    const gridPositions: IDriverGridPosition[] = positions
      .map(p => ({ driver: raceDrivers.find(d => d.activeNumber === p.driver_number)!, grid: p.position }))
      .filter(p => p.driver);

    const qualifySessionResult = await cachedFetch(`https://api.openf1.org/v1/session_result?session_key=${meeting.qualifyId}`).then(r => r.json());
    const circuit = await resolveCircuit(meeting.name, meeting.location, circuits);
    const basisRace = mapper.basisRace(circuit, round++, seasonId);
    const raceResult = mapper.raceResult({
      drivers: raceDrivers,
      laps: raceLaps,
      gridPositions,
      race: basisRace,
      sessionResults: raceSessionResult,
    });
    const qualifyResult = mapper.qualifyResult({
      drivers: qualifyDrivers,
      race: basisRace,
      sessionResults: qualifySessionResult,
    });
    return new Promise(resolve => setTimeout(() => resolve({ meeting, race: raceResult, qualify: qualifyResult }), 1000));
  };

  return meetings.reduce(
    async (accPromise, race) => {
      const acc = await accPromise;
      console.log(`Building results for`, race.name, race.qualifyId, race.raceId);
      return [...acc, await buildResult(race, round++)];
    },
    Promise.resolve([] as MeetingResult[]),
  );
};
