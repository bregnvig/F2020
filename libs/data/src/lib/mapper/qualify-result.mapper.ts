import { IDriver, IDriverQualifying, IRaceBasis } from '../model';
import { IQualifyResult } from './../model/race.model';
import { SessionResult } from '@f2020/openf1';
import { filterUndefined, isTruthy } from '@f2020/tools';
import { findDriver, getDrivers } from './mapper-utils';

interface OpenF1QualifyParams {
  sessionResults: SessionResult[];
  drivers: IDriver[];
  race: IRaceBasis;
}

const openF1Map = (source: OpenF1QualifyParams): IQualifyResult => {
  const sortedResults = [...source.sessionResults];
  const drivers = getDrivers(source.drivers);

  return {
    ...source.race,
    results: sortedResults
      .map((sessionResult, index) => {
        const driver = findDriver(drivers, sessionResult.driver_number, `Qualify result ${source.race.name}`);
        if (!driver) return undefined;
        const duration = Array.isArray(sessionResult.duration) ? sessionResult.duration : [];
        const latestQ = duration.length > 0 ? (duration.toReversed().find(isTruthy) ?? 0) * 1000 : undefined;
        return filterUndefined<IDriverQualifying>({
          driver,
          // OpenF1 sometimes has no position for a driver with times. The results are in order, so the index is used
          position: sessionResult.position ?? index + 1,
          duration: latestQ,
        });
      })
      .filter(isTruthy),
  };
};

export function map(source: OpenF1QualifyParams): IQualifyResult {
  return openF1Map(source);
}
