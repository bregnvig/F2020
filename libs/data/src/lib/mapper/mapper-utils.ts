import { Lap } from '@f2020/openf1';
import { IDriver, IDriverGridPosition, IFastestLap } from '../model';

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

export const getGridPositions = (gridPositions: IDriverGridPosition[]): Map<string, number> => {
  return gridPositions.reduce((acc, gridPos) => {
    acc.set(gridPos.driver.driverId, gridPos.grid);
    return acc;
  }, new Map<string, number>());
};

export const getDrivers = (drivers: IDriver[]): Map<number, IDriver> => {
  const map = drivers.reduce((acc, driver) => {
    driver.permanentNumbers.forEach(number => acc.set(number, driver));
    return acc;
  }, new Map<number, IDriver>());
  drivers.forEach(driver => {
    driver.activeNumber != null && map.set(driver.activeNumber, driver);
  });
  return map;
};

export const ChampionshipPoints = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
