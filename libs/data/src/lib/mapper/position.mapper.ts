import { Lap, Position } from '@f2020/openf1';
import { arrayUtils, filterUndefined, requiredValue, toMap } from '@f2020/tools';
import { IDriver, IDriverRaceResult, IFastestLap, IRaceBasis } from '../model';
import { IRaceResult } from './../model/race.model';

interface OpenF1PositionParams {
  positions: Position[];
  drivers: IDriver[];
  race: IRaceBasis;
}

const openF1Map = (source: OpenF1PositionParams): IDriverRaceResult[] => {

  const gridPositions = source.positions.toReversed().reduce(toMap<Position, number>('driver_number'), new Map<number, Position>());
  const currentPositions = [...source.positions.reduce(toMap<Position, number>('driver_number'), new Map<number, Position>()).values()].toSorted((a, b) => a.position - b.position);
  const drivers = source.drivers.reduce((acc, driver) => {
    driver.permanentNumber.forEach(number => acc.set(number, driver));
    return acc;
  }, new Map<number, IDriver>());

  return currentPositions.map(position => {
    const driver = requiredValue(drivers.get(position.driver_number), 'Result driver with driver number', position.driver_number);
    const grid = requiredValue(gridPositions.get(position.driver_number), 'Grid position', position.driver_number).position;
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
