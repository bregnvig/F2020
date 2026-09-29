import { readFileSync } from 'fs';
import { parseIcsCalendar, VCalendar } from 'ts-ics';
import { Circuit } from '@f2020/data';
import { requiredValue, StringUtils } from '@f2020/tools';
import { DateTime } from 'luxon';
import { resolveCircuit } from './circuit.resolver';

export interface SeasonRace {
  circuit: Circuit,
  close: DateTime,
  raceStart: DateTime,
  url?: string,
}

const isTesting = /.*TESTING 20.*/;
const isPracticeOne = /.*Practice ?1$/;
const isRace = /.*- Race$/i;

const raceNameOf = (summary: string) => /FORMULA 1(.*) -/.exec(summary)?.[1]?.replace(/\d{4}$/, '').trim();

const raceHubHosts = ['cal.f1.com', 'www.formula1.com', 'formula1.com'];

/**
 * Extracts the link that follows "Visit the Race Hub" in an event description.
 * ts-ics leaves the escaped newlines (\\n) in the description, so both escaped and real line breaks are accepted.
 * Only https links to an F1 host are returned. The cal.f1.com short link is kept as is, so F1 can repoint it later.
 */
export const raceHubUrl = (description: string | undefined): string | undefined => {
  const candidate = /Visit the Race Hub(?:\\n|\s)+(https:\/\/[^\s\\]+)/.exec(description ?? '')?.[1];
  if (!candidate) {
    return undefined;
  }
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' && raceHubHosts.includes(url.hostname) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Reads the races from an ics calendar file. A race closes when Practice 1 starts.
 * Events that are still to be confirmed (TBC) are ignored, as they don't match Practice 1 or Race.
 */
export const readCalendarRaces = async (icsFile: string, circuits: Circuit[]): Promise<SeasonRace[]> => {
  const calendarParsed: VCalendar = parseIcsCalendar(readFileSync(icsFile, 'utf8'));

  const events = calendarParsed.events
    .filter(e => isPracticeOne.test(e.summary) && !isTesting.test(e.summary))
    .sort((a, b) => a.start.date.getTime() - b.start.date.getTime());

  return events.reduce(async (accPromise, event) => {
    const acc = await accPromise;
    const raceName = raceNameOf(event.summary);
    const race = requiredValue(calendarParsed.events.find(e => isRace.test(e.summary) && raceNameOf(e.summary) === raceName), raceName);
    const circuit = await resolveCircuit(event.summary, event.location, circuits);
    const url = raceHubUrl(race.description);
    !url && console.warn('No Race Hub link found for', raceName);
    return [...acc, {
      circuit: { ...circuit, name: StringUtils.titleCase(raceName) },
      close: DateTime.fromJSDate(event.start.date),
      raceStart: DateTime.fromJSDate(race.start.date),
      url,
    } as SeasonRace];
  }, Promise.resolve([] as SeasonRace[]));
};
