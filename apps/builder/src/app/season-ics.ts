import { readFileSync } from 'fs';
import { parseIcsCalendar, VCalendar } from 'ts-ics';
import { firebaseApp } from './firebase';
import { Circuit, IRace, mapper } from '@f2020/data';
import { requiredValue } from '@f2020/tools';
import { DateTime } from 'luxon';
import { writeSeason } from './season';

const nameToF1 = {
  'mexico city grand prix': 'GRAN PREMIO DE LA CIUDAD DE MÉXICO',
  ['São Paulo Grand Prix'.toLocaleLowerCase()]: 'GRANDE PRÊMIO DE SÃO PAULO',
};

interface SeasonRace {
  circuit: Circuit,
  close: DateTime,
}

export const buildNewSeason = async (seasonId: number) => {
  const icsCalendarString = readFileSync('apps/builder/src/assets/f1-fake-2023.ics', 'utf8');
  const calendarParsed: VCalendar = parseIcsCalendar(icsCalendarString);

  const practiceOne = /.*Practice ?1$/;

  const circuits = await firebaseApp.database.collection('circuits').get().then(snapshot => snapshot.docs.map(doc => doc.data() as Circuit));
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
    const race = mapper.raceIcs(cr.circuit, { close: cr.close, round, season: seasonId }, previous);
    previous = race;
    return race;
  });

  const season = mapper.season(seasonId, races[3].close);
  return writeSeason(season, races);
};
