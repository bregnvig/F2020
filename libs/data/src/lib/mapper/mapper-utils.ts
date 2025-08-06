import { GridPosition, Lap } from '@f2020/openf1';
import { IDriver, IFastestLap } from '../model';

export const getRankedTimes = (laps: Lap[]): Record<number, IFastestLap> => {
  const bestTimes = laps
    .filter(({ lap_duration }) => typeof lap_duration === 'number')
    .reduce((acc, lap) => {
      const previous = acc.get(lap.driver_number)?.time ?? Number.MAX_SAFE_INTEGER;
      (lap.lap_duration! * 1000) < previous && acc.set(lap.driver_number, { time: lap.lap_duration! * 1000, lap: lap.lap_number });
      return acc;
    }, new Map<number, Omit<IFastestLap, 'rank'>>());
  return Object.fromEntries([...bestTimes.entries()]
    .toSorted(([, a], [, b]) => a.time - b.time).map(([driverNumber, lap], index) => [driverNumber, ({ ...lap, rank: index + 1 }) as IFastestLap]),
  );
};

export const getGridPositions = (gridPositions: GridPosition[]): Map<number, number> => {
  return gridPositions.reduce((acc, gridPos) => {
    acc.set(gridPos.driver_number, gridPos.position);
    return acc;
  }, new Map<number, number>());
};

export const getDrivers = (drivers: IDriver[]): Map<number, IDriver> => drivers.reduce((acc, driver) => {
  driver.permanentNumber.forEach(number => acc.set(number, driver));
  return acc;
}, new Map<number, IDriver>());

export const ChampionshipPoints = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
