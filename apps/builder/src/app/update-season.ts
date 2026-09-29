import { readFileSync } from 'fs';
import { assetPath } from './assets';
import { Circuit, IRace, ITeam, mapper } from '@f2020/data';
import { requiredValue } from '@f2020/tools';
import { firebaseApp } from './firebase';
import { converter } from './converter';
import { readCalendarRaces } from './calendar';
import { racesURL } from './season-ics';

const overwritableStates: IRace['state'][] = ['waiting', 'open'];

/**
 * Rebuilds the remaining races of a season from an updated ics calendar.
 *
 * The last race in Firestore that has started is kept, together with every race before it.
 * The calendar races after it are written from the next round onwards, overwriting the existing races
 * with those round numbers. Existing races beyond the new last round are deleted.
 *
 * An open race is overwritten with the new circuit and dates, but keeps its state, open date, drivers, teams,
 * selected driver and selected team, so the bids already placed stay valid. Races that are closed, completed
 * or cancelled are never overwritten.
 *
 * The season document, teams, last year and standings are left untouched.
 *
 * Nothing is written unless `write` is true.
 */
export const updateSeasonFromCalendar = async (seasonId: number, icsFile: string, write: boolean) => {
  const db = firebaseApp.database;
  const racesCollection = db.collection(racesURL(seasonId));

  const existingRaces = await racesCollection.withConverter(converter.race).get()
    .then(snapshot => snapshot.docs.map(doc => doc.data() as IRace).sort((a, b) => a.round - b.round));
  const now = new Date();
  const lastStarted = requiredValue(existingRaces.filter(r => r.raceStart.toJSDate() <= now).at(-1), `a started race in season ${seasonId}`);
  console.log(`Last started race is round ${lastStarted.round} ${lastStarted.name} (${lastStarted.state}) ${lastStarted.raceStart.toISO()}`);

  const circuits: Circuit[] = JSON.parse(readFileSync(assetPath('circuits.json')).toString());
  const calendarRaces = await readCalendarRaces(icsFile, circuits)
    .then(races => races.filter(r => r.raceStart > lastStarted.raceStart));
  if (!calendarRaces.length) {
    throw new Error(`No races in ${icsFile} after ${lastStarted.name}`);
  }

  const teams = await db.collection(`seasons/${seasonId}/teams`).get()
    .then(snapshot => snapshot.docs.map(doc => doc.data() as ITeam));
  const existingByRound = new Map(existingRaces.map(r => [r.round, r]));

  let previous = lastStarted;
  const races = calendarRaces.map((cr, index) => {
    const round = lastStarted.round + 1 + index;
    const existing = existingByRound.get(round);
    if (existing && !overwritableStates.includes(existing.state)) {
      throw new Error(`Round ${round} ${existing.name} is ${existing.state} and will not be overwritten`);
    }
    const mapped = mapper.race(cr.circuit, undefined, {
      raceStart: cr.raceStart,
      state: 'waiting',
      close: cr.close,
      round,
      season: seasonId,
    }, previous, []);
    const race: IRace = existing?.state === 'open'
      ? {
        ...mapped,
        state: existing.state,
        open: existing.open,
        drivers: existing.drivers ?? [],
        teams: existing.teams,
        selectedDriver: existing.selectedDriver,
        selectedTeam: existing.selectedTeam,
      }
      : { ...mapped, selectedTeam: teams[Math.floor(Math.random() * teams.length)] };
    previous = race;
    return { race, existing };
  });

  const lastRound = races.at(-1).race.round;
  const obsolete = existingRaces.filter(r => r.round > lastRound);
  const blocked = obsolete.filter(r => r.state !== 'waiting');
  if (blocked.length) {
    throw new Error(`Rounds ${blocked.map(r => `${r.round} (${r.state})`).join(', ')} would be deleted, but are not waiting`);
  }

  const bidCount = async (round: number) => racesCollection.doc(round.toString(10)).collection('bids').count().get()
    .then(snapshot => snapshot.data().count);

  for (const { race, existing } of races) {
    const bids = existing ? await bidCount(race.round) : 0;
    console.log(
      `Round ${race.round}: ${existing ? `${existing.name} (${existing.state})` : '<new>'} -> ${race.name} (${race.state})`,
      `close ${race.close.toISO()} race ${race.raceStart.toISO()}`,
      bids ? `⚠️  keeps ${bids} bids` : '',
    );
  }
  for (const race of obsolete) {
    const bids = await bidCount(race.round);
    if (bids) {
      throw new Error(`Round ${race.round} ${race.name} would be deleted, but has ${bids} bids`);
    }
    console.log(`Round ${race.round}: ${race.name} (${race.state}) -> deleted`);
  }

  if (!write) {
    console.log('Dry run. Nothing written. Run with --write to update Firestore.');
    return;
  }

  const batch = db.batch();
  races.forEach(({ race }) => batch.set(racesCollection.doc(race.round.toString(10)).withConverter(converter.race), race));
  obsolete.forEach(race => batch.delete(racesCollection.doc(race.round.toString(10))));
  await batch.commit();
  console.log(`Wrote ${races.length} races and deleted ${obsolete.length}`);
};
