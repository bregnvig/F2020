import { countries } from './countries';
import { Circuit, ErgastRace, IDriver, IRace, IRaceBasis } from '../model';
import { DateTime } from 'luxon';


const basisMapErgast = (source: ErgastRace): IRaceBasis => {
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

const basisMapICS = (source: Circuit, round: number, season: number): IRaceBasis => {
  return {
    name: source.name,
    countryCode: source.countryCode2,
    location: source.location,
    season: season,
    round: round,
    circuitId: source.circuitId,
  };
};

export function basisMap(source: ErgastRace): IRaceBasis;
export function basisMap(source: Circuit, round: number, season: number): IRaceBasis;
export function basisMap(source: ErgastRace | Circuit, round?: number, season?: number): IRaceBasis {
  return 'Circuit' in source ? basisMapErgast(source) : basisMapICS(source, round!, season!);
}

const mapEragst = (source: ErgastRace, selectedDriver: IDriver, previousRace?: IRace, drivers?: IDriver[]): IRace => {
  const raceTime = DateTime.fromISO(`${source.date}T${source.time || '00:00:00Z'}`);
  const closeTime = raceTime.minus({ minutes: 10, hour: 4, day: 2 });
  return {
    ...basisMap(source),
    state: 'waiting',
    close: closeTime,
    raceStart: raceTime,
    selectedDriver: selectedDriver.driverId,
    drivers: (drivers || []).map(d => d.driverId),
    open: previousRace?.close.startOf('day').plus({ day: 3 }) ?? closeTime.minus({ day: 7 }),
  };
};

const mapICS = (circuit: Circuit, params: Pick<IRace, 'close' | 'round' | 'season' | 'raceStart'>, selectedDriver: IDriver, previousRace?: IRace, drivers?: IDriver[]): IRace => {
  return {
    ...basisMapICS(circuit, params.round, params.season),
    state: 'waiting',
    close: params.close,
    raceStart: params.raceStart,
    selectedDriver: selectedDriver.driverId,
    drivers: (drivers || []).map(d => d.driverId),
    open: previousRace?.close.startOf('day').plus({ day: 3 }) ?? DateTime.local(),
  };
};

export function map(source: ErgastRace, selectedDriver: IDriver, previousRace?: IRace, drivers?: IDriver[]): IRace;
export function map(circuit: Circuit, selectedDriver: IDriver, params: Pick<IRace, 'close' | 'round' | 'season' | 'raceStart'>, previousRace?: IRace, drivers?: IDriver[]): IRace;
export function map(sourceOrCircuit: ErgastRace | Circuit, selectedDriver: IDriver, paramsOrPreviousRace?: Pick<IRace, 'close' | 'round' | 'season'> | IRace, previousRaceOrDrivers?: IRace | IDriver[], drivers?: IDriver[]): IRace {
  if ('circuitId' in sourceOrCircuit) {
    return mapICS(sourceOrCircuit, paramsOrPreviousRace as Pick<IRace, 'close' | 'round' | 'season' | 'raceStart'>, selectedDriver, previousRaceOrDrivers as IRace, drivers);
  }
  return mapEragst(sourceOrCircuit, selectedDriver, previousRaceOrDrivers as IRace, drivers);
}
