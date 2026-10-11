import { Location } from '@f2020/openf1';
import { isTruthy } from '@f2020/tools';
import { IDriver, IDriverLocation } from '../model';
import { findDriver, getDrivers } from './mapper-utils';

interface OpenF1LocationParams {
  drivers: IDriver[];
  /** The latest location of each driver */
  locations: Location[];
}

const openF1Map = (source: OpenF1LocationParams): IDriverLocation[] => {
  const drivers = getDrivers(source.drivers);
  return source.locations
    .map(({ driver_number, x, y, z }) => {
      const driver = findDriver(drivers, driver_number, 'Location');
      return driver ? { driver, x, y, z } : undefined;
    })
    .filter(isTruthy);
};

export function map(source: OpenF1LocationParams): IDriverLocation[] {
  return openF1Map(source);
}
