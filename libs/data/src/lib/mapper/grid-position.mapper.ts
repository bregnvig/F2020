import { GridPosition } from '@f2020/openf1';
import { requiredValue } from '@f2020/tools';
import { IDriver, IDriverGridPosition } from '../model';
import { getDrivers } from './mapper-utils';

interface OpenF1GridPositionParams {
  positions: GridPosition[];
  drivers: IDriver[];
}

const openF1Map = (source: OpenF1GridPositionParams): IDriverGridPosition[] => {

  const drivers = getDrivers(source.drivers);

  return source.positions.map(position => {
    const driver = requiredValue(drivers.get(position.driver_number), 'Result driver with driver number', position.driver_number);
    return ({
      driver,
      grid: position.position,
    }) as IDriverGridPosition;
  });
};

export function map(source: OpenF1GridPositionParams): IDriverGridPosition[] {
  return openF1Map(source);
}
