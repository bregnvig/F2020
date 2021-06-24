import { IDriver, IRace, ISeason, mapper } from '@f2020/data';
import { getFullSeasonDrivers, getSeason, getSeasonDrivers } from '@f2020/ergast';
import { WriteResult } from '@google-cloud/firestore';
import { converter } from './converter';
import { firebaseApp } from './firebase';

const random = (max: number): number => Math.floor(Math.random() * Math.floor(max));

const buildRaces = async (seasonId: string): Promise<IRace[]> => {
  const ergastSeason = await getSeason(seasonId);
  const previousSeasonDrivers: IDriver[] = mapper.drivers(await getFullSeasonDrivers(`${parseInt(seasonId, 10) - 1}`));

  const usedCodes = new Set<string>();
  return ergastSeason.Races.reduce((acc, ergastRace, index) => {
    const nationality = mapper.nationality(ergastRace.Circuit.Location.country);
    const selectedDriver = previousSeasonDrivers.find(d => d.nationality === nationality && !usedCodes.has(d.driverId)) || previousSeasonDrivers[random(previousSeasonDrivers.length)];
    usedCodes.add(selectedDriver.driverId);
    acc.push(mapper.race(ergastRace, selectedDriver, index ? acc[index - 1] : null, !index ? previousSeasonDrivers : null));
    return acc;
  }, []);
};

export const buildNewSeason = async (seasonId: string) => {
  const ergastSeason = await getSeason(seasonId);

  const races: IRace[] = await buildRaces(seasonId);
  console.log(races.filter(r => !r.open.isValid || !r.close.isValid));
  const season = mapper.season(ergastSeason, races[3].open);
  season['current'] = true;

  return writeSeason(season, races);
};

export const appendRaces = async (seasonId: string): Promise<any> => {
  const ergastRaces: IRace[] = await buildRaces(seasonId);
  const firestoreRaces = await firebaseApp.datebase.collection(`${seasonsURL}/${seasonId}/races`).withConverter(converter.race)
    .get()
    .then(snapshot => snapshot.docs.map(doc => doc.data() as IRace));

  ergastRaces.filter(er => firestoreRaces.every(fr => fr.round !== er.round))
    .forEach(async r => await firebaseApp.datebase.doc(`${seasonsURL}/${seasonId}/races/${r.round}`).withConverter(converter.race).set(r));
};

export const buildPreviousSeason = async (seasonId: string) => {

  const ergastSeason = await getSeason(seasonId);

  const usedDriverIds = new Set<string>();
  const races: IRace[] = await ergastSeason.Races.reduce(async (previousPromise, ergastRace, index: number, ergastRaces) => {
    const acc = await previousPromise;
    const nationality = mapper.nationality(ergastRace.Circuit.Location.country);
    const roundDrivers: IDriver[] = (await getSeasonDrivers(seasonId, (index + 1).toString(10))).map(mapper.driver);
    console.log('Round driver ', roundDrivers);
    const selectedDriver = roundDrivers.find(d => d.nationality === nationality && !usedDriverIds.has(d.driverId)) || roundDrivers[random(roundDrivers.length)];
    usedDriverIds.add(selectedDriver.driverId);
    acc.push(mapper.race(ergastRace, selectedDriver, index ? acc[index - 1] : null, roundDrivers));
    return Promise.resolve(acc);
  }, Promise.resolve(<IRace[]>[]));

  const season: ISeason = mapper.season(ergastSeason, races[3].open);
  return writeSeason(season, races);
  //   .catch(error => console.error(error));
};

const seasonsURL = 'seasons';
const racesURL = seasonId => `${seasonsURL}/${seasonId}/races`;

const writeSeason = (season: ISeason, races: IRace[]): Promise<WriteResult[]> => {
  return firebaseApp.datebase.collection(seasonsURL).doc(season.id).withConverter(converter.season).set(season)
    .then(() => {
      const ref = firebaseApp.datebase.collection(racesURL(season.id));
      const racesWrite = races.map(race => ref.doc(race.round.toString(10)).withConverter(converter.race).set(race));
      return Promise.all(racesWrite);
    });
};
