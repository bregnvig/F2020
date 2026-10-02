import { GridPosition } from '@f2020/openf1';
import { isTruthy } from '@f2020/tools';
import { IDriver, IDriverGridPosition } from '../model';
import { findDriver, getDrivers } from './mapper-utils';

interface OpenF1GridPositionParams {
  positions: GridPosition[];
  drivers: IDriver[];
}

const openF1Map = (source: OpenF1GridPositionParams): IDriverGridPosition[] => {
  const drivers = getDrivers(source.drivers);

  return source.positions
    .map(position => {
      const driver = findDriver(drivers, position.driver_number, 'Starting grid');
      if (!driver) return undefined;
      return {
        driver,
        grid: position.position,
      } as IDriverGridPosition;
    })
    .filter(isTruthy);
};

export function map(source: OpenF1GridPositionParams): IDriverGridPosition[] {
  return openF1Map(source);
}
