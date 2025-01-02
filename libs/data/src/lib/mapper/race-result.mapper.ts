import { requiredValue, toMap } from '@f2020/tools';
import { ErgastRaceResult, IDriver, IDriverRaceResult, IFastestLap, IRace } from '../model';
import { IRaceResult } from './../model/race.model';
import { driverResult } from './driver-result.mapper';
import { basisMap } from './race.mapper';
import { Lap, Position } from '@f2020/openf1';

interface OpenF1ResultParams {
  laps: Lap[];
  positions: Position[];
  drivers: IDriver[];
  race: IRace;
}

const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

const openF1Map = (source: OpenF1ResultParams): IRaceResult => {

  const gridPositions = source.positions.toReversed().reduce(toMap<Position, number>('driver_number'), new Map<number, Position>());
  const miniSectors = source.laps.reduce((acc, lap) => Math.max(acc, lap.segments_sector_3.length), 0);
  const participants = source.race.drivers?.map(driver => source.drivers.find(({ driverId }) => driverId === driver)!.permanentNumber) ?? [];
  // const dns: number[] = participants.filter(permanentNumbers => !source.laps.some(lap => permanentNumbers.some(permanentNumber => permanentNumber === lap.driver_number))).flat().filter(driverNumber => gridPositions.has(driverNumber));
  const dnfs = [...source.laps.reduce(toMap<Lap, number>('driver_number'), new Map<number, Lap>()).values()].filter(l => l.segments_sector_3.length !== miniSectors).toSorted((a, b) => b.lap_number - a.lap_number).map(l => l.driver_number);
  const nc = [...dnfs];
  const finalPositions = [...source.positions.filter(p => !nc.includes(p.driver_number)).reduce(toMap<Position, number>('driver_number'), new Map<number, Position>()).values()].toSorted((a, b) => a.position - b.position);
  const bestTimes = source.laps.filter(({ lap_duration }) => typeof lap_duration === 'number').reduce((acc, lap) => {
    const previous = acc.get(lap.driver_number)?.time ?? Number.MAX_SAFE_INTEGER;
    (lap.lap_duration! * 1000) < previous && acc.set(lap.driver_number, { time: lap.lap_duration! * 1000, lap: lap.lap_number });
    return acc;
  }, new Map<number, Omit<IFastestLap, 'rank'>>());
  const rankedTimes = Object.fromEntries([...bestTimes.entries()]
    .toSorted(([, a], [, b]) => a.time - b.time).map(([driverNumber, lap], index) => [driverNumber, ({ ...lap, rank: index + 1 }) as IFastestLap]),
  );
  const drivers = source.drivers.reduce((acc, driver) => {
    driver.permanentNumber.forEach(number => acc.set(number, driver));
    return acc;
  }, new Map<number, IDriver>());

  const results = [
    ...finalPositions.map((position, index) => ({
      driver: drivers.get(position.driver_number)!,
      position: position.position,
      grid: gridPositions.get(position.driver_number)!.position,
      status: 'Finished',
      points: points[index] ?? 0,
      fastestLap: rankedTimes[position.driver_number],
    }) as IDriverRaceResult),
    ...nc.map((driverNumber, index) => ({
      driver: drivers.get(driverNumber)!,
      position: finalPositions.length + index + 1,
      grid: requiredValue(gridPositions.get(driverNumber), 'Grid position').position,
      status: 'DNF',
      fastestLap: rankedTimes[driverNumber],
    }) as IDriverRaceResult),
  ];
  return {
    ...source.race,
    results,
  };
};

export function map(source: OpenF1ResultParams): IRaceResult;
export function map(source: ErgastRaceResult): IRaceResult;
export function map(source: ErgastRaceResult | OpenF1ResultParams): IRaceResult {
  return 'Results' in source
    ? {
      ...basisMap(source),
      results: source.Results.map(driverResult),
    }
    : openF1Map(source);
}
