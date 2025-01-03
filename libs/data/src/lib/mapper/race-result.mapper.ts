import { filterUndefined, requiredValue, toMap } from '@f2020/tools';
import { IDriver, IDriverRaceResult, IFastestLap, IRaceBasis } from '../model';
import { IRaceResult } from './../model/race.model';
import { Lap, Position } from '@f2020/openf1';

interface OpenF1ResultParams {
  laps: Lap[];
  positions: Position[];
  drivers: IDriver[];
  race: IRaceBasis;
}

const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

const openF1Map = (source: OpenF1ResultParams): IRaceResult => {

  const gridPositions = source.positions.toReversed().reduce(toMap<Position, number>('driver_number'), new Map<number, Position>());
  const miniSectors = source.laps.reduce((acc, lap) => Math.max(acc, lap.segments_sector_3.length), 0);
  const dnfs = [...source.laps.reduce(toMap<Lap, number>('driver_number'), new Map<number, Lap>()).values()].filter(l => l.segments_sector_3.length !== miniSectors).toSorted((a, b) => b.lap_number - a.lap_number).map(l => l.driver_number);
  const finalPositions = [...source.positions.filter(p => !dnfs.includes(p.driver_number)).reduce(toMap<Position, number>('driver_number'), new Map<number, Position>()).values()].toSorted((a, b) => a.position - b.position);
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
      points: (points[index] ?? 0) + (rankedTimes[position.driver_number]?.rank === 1 && index < 10 ? 1 : 0),
      fastestLap: rankedTimes[position.driver_number],
    }) as IDriverRaceResult),
    ...dnfs.map((driverNumber, index) => ({
      driver: drivers.get(driverNumber)!,
      position: finalPositions.length + index + 1,
      grid: requiredValue(gridPositions.get(driverNumber), 'Grid position').position,
      status: 'DNF',
      fastestLap: rankedTimes[driverNumber],
    }) as IDriverRaceResult),
  ];
  return {
    ...source.race,
    results: results.map(r => filterUndefined(r)),
  };
};

export function map(source: OpenF1ResultParams): IRaceResult {
  return openF1Map(source);
}
