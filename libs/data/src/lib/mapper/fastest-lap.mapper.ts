import { Lap } from '@f2020/openf1';
import { IDriver } from '../model/driver.model';
import { IDriverLapTime, IFastestLaps } from '../model/fastest-lap.model';
import { findDriver, getDrivers } from './mapper-utils';

export interface OpenF1FastestLapParams {
  laps: Lap[];
  drivers: IDriver[];
}

/** The best lap of each driver */
const bestByDriver = (laps: Lap[]) =>
  [...laps.reduce((best, lap) => {
    const current = best.get(lap.driver_number);
    return !current || lap.lap_duration! < current.lap_duration! ? best.set(lap.driver_number, lap) : best;
  }, new Map<number, Lap>()).values()];

export const map = ({ laps, drivers }: OpenF1FastestLapParams): IFastestLaps => {
  const driverMap = getDrivers(drivers);
  const timed = laps.filter(lap => !!lap.lap_duration);
  const fastest = bestByDriver(timed)
    .toSorted((a, b) => a.lap_duration! - b.lap_duration!)
    .map(lap => ({ driver: findDriver(driverMap, lap.driver_number, 'Fastest lap'), lap: lap.lap_number, time: lap.lap_duration! }))
    .filter((lap): lap is IDriverLapTime => !!lap.driver);
  return { laps: fastest };
};
