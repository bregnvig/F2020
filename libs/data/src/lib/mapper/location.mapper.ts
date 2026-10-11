import { isTruthy } from '@f2020/tools';
import { IDriver, IDriverLocations, LocationSample } from '../model';
import { findDriver, getDrivers } from './mapper-utils';

interface OpenF1LocationParams {
  drivers: IDriver[];
  /** The samples of each driver number, oldest first */
  samples: Map<number, LocationSample[]>;
}

const openF1Map = (source: OpenF1LocationParams): IDriverLocations[] => {
  const drivers = getDrivers(source.drivers);
  return [...source.samples]
    .map(([driverNumber, samples]) => {
      const driver = findDriver(drivers, driverNumber, 'Location');
      return driver ? { driver, samples } : undefined;
    })
    .filter(isTruthy);
};

export function map(source: OpenF1LocationParams): IDriverLocations[] {
  return openF1Map(source);
}
