import { Lap, SessionResult } from '@f2020/openf1';
import { filterUndefined, isTruthy } from '@f2020/tools';
import { IDriver, IDriverGridPosition, IDriverRaceResult, IRaceBasis, IRaceResult } from '../model';
import { ChampionshipPoints, findDriver, getDrivers, getGridPositions, getRankedTimes } from './mapper-utils';

interface OpenF1RaceResultParams {
  sessionResults: SessionResult[];
  gridPositions: IDriverGridPosition[];
  laps: Lap[];
  drivers: IDriver[];
  race: IRaceBasis;
}

const openF1Map = (source: OpenF1RaceResultParams): IRaceResult => {
  const sortedResults = [...source.sessionResults];
  const gridPosition = getGridPositions(source.gridPositions);

  const drivers = getDrivers(source.drivers);
  const rankedTimes = getRankedTimes(source.laps);

  const results = sortedResults
    .map((sessionResult, index) => {
      const driver = findDriver(drivers, sessionResult.driver_number, `Race result ${source.race.name}`);
      if (!driver) return undefined;
      const grid = gridPosition.get(driver.driverId) ?? sessionResult.position;

      // Determine status based on SessionResult flags
      let status = 'Gennemført';
      if (sessionResult.dnf) status = 'Ikke fuldført';
      else if (sessionResult.dns) status = 'Ikke startet';
      else if (sessionResult.dsq) status = 'Diskvalificeret';
      // OpenF1 doesn't always flag drivers without a position. No laps means the driver never started
      else if (sessionResult.position == null) status = sessionResult.number_of_laps ? 'Ikke klassificeret' : 'Ikke startet';

      return filterUndefined<IDriverRaceResult>({
        driver,
        position: sessionResult.position,
        grid,
        status,
        fastestLap: rankedTimes[sessionResult.driver_number],
        points: status === 'Gennemført' ? ChampionshipPoints[index] ?? 0 : 0,
      });
    })
    .filter(isTruthy);

  return {
    ...source.race,
    results,
  };
};

export function map(source: OpenF1RaceResultParams): IRaceResult {
  return openF1Map(source);
}
