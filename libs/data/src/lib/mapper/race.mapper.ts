import { countries } from './countries';
import { Circuit, ErgastRace, IDriver, IRace, IRaceBasis } from '../model';
import { DateTime } from 'luxon';


export const basisMap = (source: ErgastRace): IRaceBasis => {
  const cc = countries[source.Circuit.Location.country];
  const raceStart = DateTime.fromISO(`${source.date}T${source.time || '00:00:00Z'}`);
  if (!cc) {
    throw new Error(source.Circuit.Location.country + ' not found');
  }
  return {
    name: source.raceName,
    countryCode: countries[source.Circuit.Location.country],
    location: {
      lat: parseFloat(source.Circuit.Location.lat),
      lng: parseFloat(source.Circuit.Location.long),
    },
    url: source.url,
    season: parseInt(source.season, 10),
    round: parseInt(source.round, 10),
  };
};
export const map = (source: ErgastRace, selectedDriver: IDriver, previousRace?: IRace, drivers?: IDriver[]): IRace => {
  const raceTime = DateTime.fromISO(`${source.date}T${source.time || '00:00:00Z'}`);
  const closeTime = raceTime.minus({ minutes: 10, hour: 4, day: 2 });
  return {
    ...basisMap(source),
    state: 'waiting',
    close: closeTime,
    selectedDriver: selectedDriver.driverId,
    drivers: (drivers || []).map(d => d.driverId),
    open: previousRace?.close.startOf('day').plus({ day: 3 }) ?? closeTime.minus({ day: 7 }),
  };
};

export const basisMapICS = (source: Circuit, round: number, season: number): IRaceBasis => {
  return {
    name: source.name,
    countryCode: source.countryCode2,
    location: source.location,
    season: season,
    round: round,
  };
};


export const mapICS = (circuit: Circuit, params: Pick<IRace, 'close' | 'round' | 'season'>, selectedDriver: IDriver, previousRace?: IRace, drivers?: IDriver[]): IRace => {
  return {
    ...basisMapICS(circuit, params.round, params.season),
    state: 'waiting',
    close: params.close,
    selectedDriver: selectedDriver.driverId,
    drivers: (drivers || []).map(d => d.driverId),
    open: previousRace?.close.startOf('day').plus({ day: 3 }) ?? DateTime.local(),
  };
};

