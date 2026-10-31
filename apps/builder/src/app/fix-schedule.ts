import { readFileSync } from 'fs';
import { Circuit, IRace } from '@f2020/data';
import { assetPath } from './assets';
import { readCalendarRaces } from './calendar';
import { converter } from './converter';
import { firestoreUtils } from './converter/firestore-utils';
import { firebaseApp } from './firebase';
import { racesURL } from './season-ics';

/**
 * Writes the schedule of each race in Firestore from the ics calendar, and nothing else, so it works on races of any state.
 * Races are matched by circuit, as the rounds may have moved since the season was built.
 *
 * Nothing is written unless `write` is true.
 */
export const fixSchedule = async (seasonId: number, icsFile: string, write: boolean) => {
  const racesCollection = firebaseApp.database.collection(racesURL(seasonId));
  const races = await racesCollection
    .withConverter(converter.race)
    .get()
    .then(snapshot => snapshot.docs.map(doc => doc.data() as IRace).sort((a, b) => a.round - b.round));

  const circuits: Circuit[] = JSON.parse(readFileSync(assetPath('circuits.json')).toString());
  const calendarRaces = await readCalendarRaces(icsFile, circuits);

  const updates = races.flatMap(race => {
    const calendarRace = calendarRaces.find(cr => cr.circuit.circuitId === race.circuitId);
    if (!calendarRace?.schedule.length) {
      console.warn(`Round ${race.round} ${race.name}: no schedule in the calendar`);
      return [];
    }
    console.log(`Round ${race.round} ${race.name}:`, calendarRace.schedule.map(s => `${s.type}${s.number ?? ''} ${s.start.toFormat('ccc HH:mm')}`).join(', '));
    return [{ race, schedule: calendarRace.schedule }];
  });

  if (!write) {
    console.log('Dry run. Nothing written. Run with --write to update Firestore.');
    return;
  }

  const batch = firebaseApp.database.batch();
  updates.forEach(({ race, schedule }) => batch.update(racesCollection.doc(race.round.toString(10)), { schedule: firestoreUtils.convertDateTimes(schedule) }));
  await batch.commit();
  console.log(`Wrote the schedule of ${updates.length} races`);
};
