import { firebaseApp } from './firebase';
import { Circuit, IDriver, IRace, ISeason, mapper } from '@f2020/data';
import { getDrivers } from './drivers-openf1';
import { Weather } from '@f2020/openf1';
import { Transaction } from 'firebase-admin/firestore';
import { WriteResult } from '@google-cloud/firestore';
import { converter } from './converter';
import { humanize } from './humanizer';
import { buildStandings } from './build-standings-openf1';
import { buildResults, MeetingResult } from './build-results';
import { readCalendarRaces } from './calendar';
import { assetPath } from './assets';
import { cachedFetch } from './cached-fetch';

export const buildLastYear = async (seasonId: number) => {

  const results: MeetingResult[] = await buildResults(seasonId - 1, seasonId - 1);
  console.log('Building last year', seasonId - 1, 'Number of races:', results.length);
  const db = firebaseApp.database;

  const collection = `seasons/${seasonId}/lastYear`;

  const buildRace = async (transaction: Transaction, result: MeetingResult, index: number) => {
    const qualifyWeatherData = await cachedFetch(`https://api.openf1.org/v1/weather?session_key=${result.meeting.qualifyId}`)
      .then(r => r.json())
      .then((weather: Weather[]) => weather[Math.floor(weather.length / 2)])
      .then(weather => {
        const { date, meeting_key, pressure, session_key, ...rest } = weather;
        return rest;
      });
    const qualifyWeather = await humanize.weather(qualifyWeatherData);
    console.log('Qualify', result.meeting.name, result.meeting.circuitKey, result.meeting.qualifyId, qualifyWeather);
    console.log('Race', result.meeting.name, result.meeting.raceId);

    transaction.set(db.doc(`${collection}/${result.meeting.circuitKey}`), { qualify: result.qualify, result: result.race, qualifyWeather });
    return new Promise(resolve => setTimeout(() => resolve(result.meeting.name), 1000));
  };


  return db.runTransaction(async transaction => {

    const raceMeetings = results.filter(({ meeting }) => !meeting.name.toLocaleLowerCase().includes('testing'));

    // For testing  - use this when not building all races
    // raceMeetings.length = 3;

    let round = 0;
    while (raceMeetings.length) {
      const meeting = raceMeetings.shift();
      await buildRace(transaction, meeting, round++);
    }
  });
};

const buildTeams = async (seasonId: string, drivers: IDriver[]) => {
  console.log('Building teams', drivers.length);
  const allDrivers = await getDrivers().then(
    drivers => drivers.reduce((acc, driver) => {
      return driver.teamName ? acc.set(driver.driverId, driver.teamName) : acc;
    }, new Map<string, string>()),
  );
  const db = firebaseApp.database;
  const
    teams = drivers.reduce((acc, driver) => {
      const teamName = driver.teamName ?? allDrivers.get(driver.driverId);
      const team = acc.find(t => t.name === teamName) ?? { name: teamName, drivers: [] };
      !team.drivers.includes(driver.driverId) && team.drivers.push(driver.driverId);
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
        console.log('Updating team', team.name, constructorId, team.drivers);
        transaction.set(teamCollection.doc(constructorId), { ...team, constructorId });
      });
    return Promise.resolve(teams);
  });
};

export const buildNewSeason = async (seasonId: number) => {
  const circuits = await firebaseApp.database.collection('circuits').get().then(snapshot => snapshot.docs.map(doc => doc.data() as Circuit));
  const drivers = await getDrivers('latest').then(async latest => {
    const existing = await firebaseApp.database.collection('drivers').get().then(snapshot => snapshot.docs.map(doc => doc.data() as IDriver));
    return mapper.joinDrivers(latest, existing);
  });

  const getSelectedDriver = (countryCode: string) => {
    const candidates = drivers.filter(d => d.countryCode === countryCode);
    return candidates[Math.floor(Math.random() * candidates.length)] ?? drivers[Math.floor(Math.random() * drivers.length)];
  };

  const calenderRaces = await readCalendarRaces(assetPath(`f${seasonId}.ics`), circuits);

  let previous: IRace | undefined;
  console.log('Building season', seasonId, calenderRaces.length);
  const races = calenderRaces.map((cr, round) => {
    const race = mapper.race(cr.circuit, !round ? getSelectedDriver(cr.circuit.countryCode2) : undefined, {
      raceStart: cr.raceStart,
      state: !round ? 'open' : 'waiting',
      close: cr.close,
      round: round + 1,
      season: seasonId,
    }, previous, !round ? drivers : []);
    previous = race;
    return race;
  });

  const season = mapper.season(seasonId, races[3].close);
  return buildTeams(seasonId.toString(), drivers)
    .then(teams => races.map(r => ({ ...r, selectedTeam: teams[Math.floor(Math.random() * teams.length)] }) as IRace))
    .then(racesWithTeams => writeSeason(season, racesWithTeams))
    .then(() => buildLastYear(seasonId))
    .then(() => buildStandings(seasonId, seasonId - 1));
  /*
  */
};

const seasonsURL = 'seasons';
export const racesURL = seasonId => `${seasonsURL}/${seasonId}/races`;

const writeSeason = async (season: ISeason, races: IRace[]): Promise<WriteResult[]> => {
  return firebaseApp.database.collection(seasonsURL).doc(season.id).withConverter(converter.season).set(season)
    .then(() => {
      const ref = firebaseApp.database.collection(racesURL(season.id));
      const racesWrite = races.map(race => ref.doc(race.round.toString(10)).withConverter(converter.race).set(race));
      return Promise.all(racesWrite);
    });
};
