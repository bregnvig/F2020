import { ErgastDriversQualifying, IDriver, IRaceBasis } from '../model';
import { IQualifyResult } from './../model/race.model';
import { driverQualifying } from './driver-qualifying.mapper';
import { basisMap } from './race.mapper';
import { Lap, Position } from '@f2020/openf1';
import { requiredValue, toMap } from '@f2020/tools';

const ergastMap = (source: ErgastDriversQualifying): IQualifyResult => {
  return {
    ...basisMap(source),
    results: source.QualifyingResults.map(driverQualifying),
  };
};

interface OpenF1QualifyParams {
  laps: Lap[];
  positions: Position[];
  drivers: IDriver[];
  race: IRaceBasis;
}

const openF1Map = (source: OpenF1QualifyParams): IQualifyResult => {

  const finalPositions = [...source.positions
    .reduce(toMap<Position, number>('driver_number'), new Map<number, Position>()).values(),
  ].toSorted((a, b) => a.position - b.position);
  const bestTimes = source.laps.reduce((acc, lap) => {
    const previous = acc.get(lap.driver_number) ?? Number.MAX_SAFE_INTEGER;
    (typeof lap.lap_duration === 'number' && (lap.lap_duration * 1000) < previous) && acc.set(lap.driver_number, lap.lap_duration * 1000);
    return acc;
  }, new Map<number, number>());
  const drivers = source.drivers.reduce((acc, driver) => {
    driver.permanentNumber.forEach(number => acc.set(number, driver));
    return acc;
  }, new Map<number, IDriver>());

  return {
    ...source.race,
    results: finalPositions.map(position => {
      const driver = requiredValue(drivers.get(position.driver_number), 'Driver ' + position.driver_number);
      return {
        driver,
        position: position.position,
        duration: bestTimes.get(position.driver_number),
      };
    }),
  };
};

export function map(source: OpenF1QualifyParams): IQualifyResult;
export function map(source: ErgastDriversQualifying): IQualifyResult;
export function map(source: ErgastDriversQualifying | OpenF1QualifyParams): IQualifyResult {
  return 'QualifyingResults' in source ? ergastMap(source) : openF1Map(source);
}

