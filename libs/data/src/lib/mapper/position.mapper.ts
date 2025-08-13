import { Position } from '@f2020/openf1';
import { requiredValue, toMap } from '@f2020/tools';
import { IDriver, IDriverGridPosition, IDriverRaceResult, IRaceBasis } from '../model';
import { getDrivers, getGridPositions } from './mapper-utils';

interface OpenF1PositionParams {
  positions: Position[];
  gridPositions: IDriverGridPosition[];
  drivers: IDriver[];
  race: IRaceBasis;
}

const openF1Map = (source: OpenF1PositionParams): IDriverRaceResult[] => {

  const gridPositions = getGridPositions(source.gridPositions);
  const currentPositions = [...source.positions.reduce(toMap<Position, number>('driver_number'), new Map<number, Position>()).values()].toSorted((a, b) => a.position - b.position);
  const drivers = getDrivers(source.drivers);

  return currentPositions.map(position => {
    const driver = requiredValue(drivers.get(position.driver_number), 'Result driver with driver number', position.driver_number);
    const grid = requiredValue(gridPositions.get(driver.driverId), 'Grid position', driver.driverId);
    return ({
      driver,
      position: position.position,
      grid,
      status: 'Racing',
    }) as IDriverRaceResult;
  });
};

export function map(source: OpenF1PositionParams): IDriverRaceResult[] {
  return openF1Map(source);
}
