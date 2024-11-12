import { readFileSync } from 'fs';
import { parseIcsCalendar, VCalendar } from 'ts-ics';
import { firebaseApp } from './firebase';
import { Circuit, IDriver, IRace, mapper } from '@f2020/data';
import { requiredValue } from '@f2020/tools';
import { DateTime } from 'luxon';
import { writeSeason } from './season';
import { getDrivers } from './drivers-openf1';

const nameToF1 = {
  'mexico city grand prix': 'GRAN PREMIO DE LA CIUDAD DE MÉXICO',
  ['São Paulo Grand Prix'.toLocaleLowerCase()]: 'GRANDE PRÊMIO DE SÃO PAULO',
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
  const icsCalendarString = readFileSync('apps/builder/src/assets/f1-fake-2023.ics', 'utf8');
  const calendarParsed: VCalendar = parseIcsCalendar(icsCalendarString);

  const practiceOne = /.*Practice ?1$/;

  const circuits = await firebaseApp.database.collection('circuits').get().then(snapshot => snapshot.docs.map(doc => doc.data() as Circuit));
  const drivers = await getDrivers('latest').then(async latest => {
    const existing = await firebaseApp.database.collection('drivers').get().then(snapshot => snapshot.docs.map(doc => doc.data() as IDriver));
    return latest.map(driver => {
      const existingDriver = existing.find(d => d.code === driver.code && d.permanentNumber === driver.permanentNumber);
      return requiredValue(existingDriver, 'Driver not found in existing drivers');
    });
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
        // console.log(circuitName);
        return event.location.toLowerCase().includes(circuitName) || event.summary.toLocaleLowerCase().includes(circuitName);
      }), `Circuit not found for ${event.summary}`),
      close: DateTime.fromJSDate(event.start.date),
    }) as SeasonRace);

  let previous: IRace | undefined;
  const races = calenderRaces.map((cr, round) => {
    const race = mapper.raceIcs(cr.circuit, { close: cr.close, round: round + 1, season: seasonId }, getSelectedDriver(cr.circuit.countryCode2), previous);
    previous = race;
    return race;
  });

  const season = mapper.season(seasonId, races[3].close);
  return writeSeason(season, races).then(() => buildTeams(seasonId.toString(), drivers));
};
