import { readFileSync } from 'fs';
import { parseIcsCalendar, VCalendar } from 'ts-ics';
import { firebaseApp } from './firebase';
import { Circuit, IDriver, IRace, mapper } from '@f2020/data';
import { requiredValue } from '@f2020/tools';
import { DateTime } from 'luxon';
import { writeSeason } from './season';
import { getDrivers } from './drivers-openf1';
import { Meeting, Session } from '@f2020/openf1';
import { firestore } from 'firebase-admin';
import { buildStandings } from './build-standings-openf1';
import Transaction = firestore.Transaction;

const nameToF1 = {
  'mexico city grand prix': 'GRAN PREMIO DE LA CIUDAD DE MÉXICO',
  ['São Paulo Grand Prix'.toLocaleLowerCase()]: 'GRANDE PRÊMIO DE SÃO PAULO',
};

const buildLastYear = async (seasonId: number) => {
  const meetings: Meeting[] = await fetch(`https://api.openf1.org/v1/meetings?year=${seasonId}`).then(r => r.json());
  console.log('Building last year', seasonId - 1, meetings.length);
  const db = firebaseApp.database;
  const circuits = await db.collection('circuits').get().then(snapshot => snapshot.docs.map(doc => doc.data() as Circuit));
  const drivers = await db.collection('drivers').get().then(snapshot => snapshot.docs.map(doc => doc.data() as IDriver));

  const collection = `seasons/${seasonId}/lastYear`;

  const buildRace = async (transaction: Transaction, meeting: Meeting, index: number) => {
    const sessions: Session[] = await fetch(`https://api.openf1.org/v1/sessions?meeting_key=${meeting.meeting_key}`).then(r => r.json());

    const qualifySession = requiredValue(sessions.find(s => s.session_name === 'Qualifying'), `Qualify session for meeting ${meeting.meeting_key}`);
    console.log('Qualify', qualifySession.circuit_short_name, qualifySession.circuit_key, qualifySession.meeting_key, qualifySession.session_key);
    const qualifyLaps = await fetch(`https://api.openf1.org/v1/laps?session_key=${qualifySession.session_key}`).then(r => r.json());
    const qualifyPositions = await fetch(`https://api.openf1.org/v1/position?session_key=${qualifySession.session_key}`).then(r => r.json());
    const circuit = requiredValue(circuits.find(c => c.circuitId === meeting.circuit_key), meeting.circuit_key.toString());
    const raceSession = requiredValue(sessions.find(s => s.session_name === 'Race'), `Race session for meeting ${meeting.meeting_key}`);
    console.log('Race', raceSession.meeting_key, raceSession.session_key);
    const raceLaps = await fetch(`https://api.openf1.org/v1/laps?session_key=${raceSession.session_key}`).then(r => r.json());
    const racePositions = await fetch(`https://api.openf1.org/v1/position?session_key=${raceSession.session_key}`).then(r => r.json());

    const qualify = mapper.qualifyResult({
      race: mapper.basisRace(circuit, index + 1, seasonId - 1),
      laps: qualifyLaps,
      drivers,
      positions: qualifyPositions,
    });
    const result = mapper.raceResult({
      race: mapper.basisRace(circuit, index + 1, seasonId - 1),
      laps: raceLaps,
      drivers,
      positions: racePositions,
    });
    transaction.set(db.doc(`${collection}/${circuit.circuitId}`), { qualify, result });
    return new Promise(resolve => setTimeout(() => resolve(qualify.name), 1000));
  };


  return db.runTransaction(async transaction => {

    const raceMeetings = meetings.filter(m => !m.meeting_name.toLocaleLowerCase().includes('testing'));

    let round = 0;
    while (raceMeetings.length) {
      const meeting = raceMeetings.shift();
      await buildRace(transaction, meeting, round++);
    }
  });
};

interface SeasonRace {
  circuit: Circuit,
  close: DateTime,
}

const buildTeams = async (seasonId: string, drivers: IDriver[]) => {
  console.log('Building teams', drivers.length);
  const db = firebaseApp.database;
  const teams = drivers.reduce((acc, driver) => {
    const team = acc.find(t => t.name === driver.teamName) ?? { name: driver.teamName, drivers: [] };
    team.drivers.push(driver.driverId);
    if (!acc.includes(team)) {
      acc.push(team);
    }
    return acc;
  }, [] as { name: string, drivers: string[] }[]);

  const teamCollection = db.collection(`seasons/${seasonId}/teams`);

  return db.runTransaction(transaction => {
    teams
      .forEach(team => {
        !team.name && console.log('Team without name', team);
        const constructorId = team.name.toLocaleLowerCase().replace(/ /g, '-');
        console.log('Updating team', team.name, constructorId);
        transaction.set(teamCollection.doc(constructorId), { ...team, constructorId });
      });
    return Promise.resolve(teams.length);
  });
};

export const buildNewSeason = async (seasonId: number) => {
  const icsCalendarString = readFileSync('apps/builder/src/assets/f2024.ics', 'utf8');
  const calendarParsed: VCalendar = parseIcsCalendar(icsCalendarString);

  const practiceOne = /.*Practice ?1$/;

  const circuits = await firebaseApp.database.collection('circuits').get().then(snapshot => snapshot.docs.map(doc => doc.data() as Circuit));
  const drivers = await getDrivers('latest').then(async latest => {
    const existing = await firebaseApp.database.collection('drivers').get().then(snapshot => snapshot.docs.map(doc => doc.data() as IDriver));
    return mapper.joinDrivers(latest, existing);
  });

  const getSelectedDriver = (countryCode: string) => {
    const candidates = drivers.filter(d => d.countryCode === countryCode);
    return candidates[Math.floor(Math.random() * candidates.length)] ?? drivers[Math.floor(Math.random() * drivers.length)];
  };

  const calenderRaces = calendarParsed.events
    .filter(e => practiceOne.test(e.summary))
    .map(event => ({
      circuit: requiredValue(circuits.find(c => {
        const circuitName = (nameToF1[c.name.toLocaleLowerCase()] ?? c.name).toLocaleLowerCase();
        return event.location.toLowerCase().includes(circuitName) || event.summary.toLocaleLowerCase().includes(circuitName);
      }), `Circuit not found for ${event.summary}`),
      close: DateTime.fromJSDate(event.start.date),
    }) as SeasonRace);

  let previous: IRace | undefined;
  const races = calenderRaces.map((cr, round) => {
    const race = mapper.race(cr.circuit, getSelectedDriver(cr.circuit.countryCode2), { close: cr.close, round: round + 1, season: seasonId }, previous, !round ? drivers : []);
    previous = race;
    return race;
  });

  const season = mapper.season(seasonId, races[3].close);
  return writeSeason(season, races)
    // .then(() => buildTeams(seasonId.toString(), drivers))
    // .then(() => buildLastYear(seasonId))
    .then(() => buildStandings(seasonId, seasonId - 1));
};
