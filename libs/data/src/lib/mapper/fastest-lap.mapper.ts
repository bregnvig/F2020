import { Lap } from '@f2020/openf1';
import { IDriver } from '../model/driver.model';
import { IDriverLapTime, IFastestLaps, ILatestLap, LapColor } from '../model/fastest-lap.model';
import { findDriver, getDrivers } from './mapper-utils';

export interface OpenF1FastestLapParams {
  laps: Lap[];
  drivers: IDriver[];
}

/** The best lap of each driver */
const bestByDriver = (laps: Lap[]) => [
  ...laps
    .reduce((best, lap) => {
      const current = best.get(lap.driver_number);
      return !current || lap.lap_duration! < current.lap_duration! ? best.set(lap.driver_number, lap) : best;
    }, new Map<number, Lap>())
    .values(),
];

export const map = ({ laps, drivers }: OpenF1FastestLapParams): IFastestLaps => {
  const driverMap = getDrivers(drivers);
  const timed = laps.filter(lap => !!lap.lap_duration);
  const best = bestByDriver(timed);
  const driverBest = new Map(best.map(lap => [lap.driver_number, lap.lap_duration!]));
  const overallBest = Math.min(...driverBest.values());
  const fastest = best
    .toSorted((a, b) => a.lap_duration! - b.lap_duration!)
    .map(lap => ({ driver: findDriver(driverMap, lap.driver_number, 'Fastest lap'), lap: lap.lap_number, time: lap.lap_duration! }))
    .filter((lap): lap is IDriverLapTime => !!lap.driver);
  const latest = [
    ...timed
      .reduce((latest, lap) => {
        const current = latest.get(lap.driver_number);
        return !current || lap.lap_number > current.lap_number ? latest.set(lap.driver_number, lap) : latest;
      }, new Map<number, Lap>())
      .values(),
  ]
    .map(lap => {
      const color: LapColor = lap.lap_duration === overallBest ? 'purple' : lap.lap_duration === driverBest.get(lap.driver_number) ? 'green' : 'yellow';
      return { driver: findDriver(driverMap, lap.driver_number, 'Latest lap'), lap: lap.lap_number, time: lap.lap_duration!, color };
    })
    .filter((lap): lap is ILatestLap => !!lap.driver);
  return { laps: fastest, latest };
};
