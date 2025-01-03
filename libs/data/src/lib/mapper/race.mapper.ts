import { Circuit, IDriver, IRace, IRaceBasis } from '../model';
import { DateTime } from 'luxon';

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

export function basisMap(source: Circuit, round: number, season: number | string): IRaceBasis {
  return basisMapICS(source, round, typeof season === 'string' ? parseInt(season) : season);
}

const mapICS = (circuit: Circuit, params: Pick<IRace, 'close' | 'round' | 'season' | 'state' | 'raceStart'>, selectedDriver: IDriver, previousRace?: IRace, drivers?: IDriver[]): IRace => {
  return {
    ...basisMapICS(circuit, params.round, params.season),
    state: params.state ?? 'waiting',
    close: params.close,
    raceStart: params.raceStart,
    selectedDriver: selectedDriver.driverId,
    drivers: (drivers || []).map(d => d.driverId),
    open: previousRace?.close.startOf('day').plus({ day: 3 }) ?? DateTime.local(),
  };
};

export function map(circuit: Circuit, selectedDriver: IDriver, race: Pick<IRace, 'close' | 'round' | 'season' | 'raceStart' | 'state'>, previousRace?: IRace, drivers?: IDriver[]): IRace {
  return mapICS(circuit, race, selectedDriver, previousRace, drivers);
}
