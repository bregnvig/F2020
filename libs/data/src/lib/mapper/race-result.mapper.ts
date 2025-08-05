import { GridPosition, Lap, SessionResult } from '@f2020/openf1';
import { filterUndefined, requiredValue } from '@f2020/tools';
import { IDriver, IDriverRaceResult, IFastestLap, IRaceBasis, IRaceResult } from '../model';

interface OpenF1RaceResultParams {
  sessionResults: SessionResult[];
  gridPositions: GridPosition[];
  laps: Lap[];
  drivers: IDriver[];
  race: IRaceBasis;
}

export const getRankedTimes = (laps: Lap[]): Record<number, IFastestLap> => {
  const bestTimes = laps
    .filter(({ lap_duration }) => typeof lap_duration === 'number')
    .reduce((acc, lap) => {
      const previous = acc.get(lap.driver_number)?.time ?? Number.MAX_SAFE_INTEGER;
      (lap.lap_duration! * 1000) < previous && acc.set(lap.driver_number, { time: lap.lap_duration! * 1000, lap: lap.lap_number });
      return acc;
    }, new Map<number, Omit<IFastestLap, 'rank'>>());
  return Object.fromEntries([...bestTimes.entries()]
    .toSorted(([, a], [, b]) => a.time - b.time).map(([driverNumber, lap], index) => [driverNumber, ({ ...lap, rank: index + 1 }) as IFastestLap]),
  );
};

export const getGridPositions = (gridPositions: GridPosition[]): Map<number, number> => {
  return gridPositions.reduce((acc, gridPos) => {
    acc.set(gridPos.driver_number, gridPos.position);
    return acc;
  }, new Map<number, number>());
};

export const ChampionshipPoints = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

const openF1Map = (source: OpenF1RaceResultParams): IRaceResult => {
  const sortedResults = [...source.sessionResults];
  const gridPosition = getGridPositions(source.gridPositions);

  const drivers = source.drivers.reduce((acc, driver) => {
    driver.permanentNumber.forEach(number => acc.set(number, driver));
    return acc;
  }, new Map<number, IDriver>());
  const rankedTimes = getRankedTimes(source.laps);

  const results = sortedResults.map((sessionResult, index) => {
    const driver = requiredValue(drivers.get(sessionResult.driver_number), 'Driver ' + sessionResult.driver_number);
    const grid = gridPosition.get(sessionResult.driver_number) ?? sessionResult.position;

    // Determine status based on SessionResult flags
    let status = 'Gennemført';
    if (sessionResult.dnf) status = 'Ikke fuldført';
    else if (sessionResult.dns) status = 'Ikke startet';
    else if (sessionResult.dsq) status = 'Diskvalificeret';

    return filterUndefined<IDriverRaceResult>({
      driver,
      position: sessionResult.position,
      grid,
      status,
      fastestLap: rankedTimes[sessionResult.driver_number],
      points: status === 'Gennemført' ? (ChampionshipPoints[index] ?? 0) : 0,
    });
  });

  return {
    ...source.race,
    results,
  };
};

export function map(source: OpenF1RaceResultParams): IRaceResult {
  return openF1Map(source);
}
