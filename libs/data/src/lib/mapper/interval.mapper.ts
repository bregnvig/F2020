import { Interval } from '@f2020/openf1';
import { requiredValue, toMap } from '@f2020/tools';
import { IDriver, IDriverInterval } from '../model';
import { getDrivers } from './mapper-utils';

interface OpenF1IntervalParams {
  drivers: IDriver[];
  intervals: Interval[];
}

const openF1Map = (source: OpenF1IntervalParams): IDriverInterval[] => {

  const currentPositions = [...source.intervals.reduce(toMap<Interval, number>('driver_number'), new Map<number, Interval>()).values()];
  const drivers = getDrivers(source.drivers);

  return currentPositions.map(position => {
    const driver = requiredValue(drivers.get(position.driver_number), 'Interval driver with driver number', position.driver_number);
    return ({
      driver,
      gapToLeader: position.gap_to_leader,
      interval: position.interval,
    }) as IDriverInterval;
  });
};

export function map(source: OpenF1IntervalParams): IDriverInterval[] {
  return openF1Map(source);
}
