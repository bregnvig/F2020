import { GridPosition, Lap, Position } from '@f2020/openf1';
import { arrayUtils, filterUndefined, requiredValue, toMap } from '@f2020/tools';
import { IDriver, IDriverRaceResult, IRaceBasis } from '../model';
import { IRaceResult } from './../model';
import { ChampionshipPoints, getGridPositions, getRankedTimes } from './race-result.mapper';

interface OpenF1ResultParams {
  laps: Lap[];
  positions: Position[];
  drivers: IDriver[];
  race: IRaceBasis;
  gridPositions: GridPosition[],
}


const getDNFs = (source: OpenF1ResultParams) => {
  const maxLapNumber = source.laps.reduce((acc, lap) => Math.max(acc, lap.lap_number), 0);
  const positionDriverNumbers = [...new Set(source.positions.map(p => p.driver_number))];
  const lapsDriverNumbers = [...new Set(source.laps.map(p => p.driver_number))];
  const dnfAtFirstLap = arrayUtils.findDeleted(positionDriverNumbers, lapsDriverNumbers);
  const dnfs = [...source.laps.reduce(toMap<Lap, number>('driver_number'), new Map<number, Lap>()).values()].filter(l => maxLapNumber - 1 > l.lap_number).toSorted((a, b) => a.lap_number - b.lap_number).map(l => l.driver_number);

  const dnfPosition = source.positions.filter(p => dnfs.includes(p.driver_number)).reduce((acc, p) => {
    return acc.set(p.driver_number, p.position);
  }, new Map<number, number>());
  // Sometimes there are mini sectors not part of the lap, which gives false dnfs. But if the position is not at the end, then it is not a DNF
  const dnfsWashed = dnfs.filter((d, index) => dnfPosition.get(d) === positionDriverNumbers.length - index);
  return [
    ...dnfsWashed.toReversed(),
    ...dnfAtFirstLap.toReversed(),
  ];
};

const openF1Map = (source: OpenF1ResultParams): IRaceResult => {

  const gridPositions = getGridPositions(source.gridPositions);

  const dnfs = getDNFs(source);

  const finalPositions = [...source.positions.filter(p => !dnfs.includes(p.driver_number)).reduce(toMap<Position, number>('driver_number'), new Map<number, Position>()).values()].toSorted((a, b) => a.position - b.position);

  const rankedTimes = getRankedTimes(source.laps);
  const drivers = source.drivers.reduce((acc, driver) => {
    driver.permanentNumber.forEach(number => acc.set(number, driver));
    return acc;
  }, new Map<number, IDriver>());

  const results = [
    ...finalPositions.map((position, index) => {
      const driver = requiredValue(drivers.get(position.driver_number), 'Result driver with driver number', position.driver_number);
      const grid = requiredValue(gridPositions.get(position.driver_number), 'Grid position', position.driver_number);
      return ({
        driver,
        position: position.position,
        grid,
        status: 'Finished',
        points: (ChampionshipPoints[index] ?? 0) + (rankedTimes[position.driver_number]?.rank === 1 && index < 10 ? 1 : 0),
        fastestLap: rankedTimes[position.driver_number],
      }) as IDriverRaceResult;
    }),
    ...dnfs.map((driverNumber, index) => {
      const driver = requiredValue(drivers.get(driverNumber), 'Result driver with driver number', driverNumber);
      const grid = requiredValue(gridPositions.get(driverNumber), 'Grid position', driverNumber);
      return ({
        driver,
        position: finalPositions.length + index + 1,
        grid,
        status: 'DNF',
        fastestLap: rankedTimes[driverNumber],
      }) as IDriverRaceResult;
    }),
  ];
  return {
    ...source.race,
    results: results.map(r => filterUndefined(r)),
  };
};

export function map(source: OpenF1ResultParams): IRaceResult {
  return openF1Map(source);
}
