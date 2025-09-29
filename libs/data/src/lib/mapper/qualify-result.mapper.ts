import { IDriver, IRaceBasis } from '../model';
import { IQualifyResult } from './../model/race.model';
import { SessionResult } from '@f2020/openf1';
import { filterUndefined, isTruthy, requiredValue } from '@f2020/tools';

interface OpenF1QualifyParams {
  sessionResults: SessionResult[];
  drivers: IDriver[];
  race: IRaceBasis;
}

const openF1Map = (source: OpenF1QualifyParams): IQualifyResult => {

  const sortedResults = [...source.sessionResults];
  const drivers = source.drivers.reduce((acc, driver) => {
    driver.permanentNumber.forEach(number => acc.set(number, driver));
    return acc;
  }, new Map<number, IDriver>());

  return {
    ...source.race,
    results: sortedResults.map(sessionResult => {
      const driver = requiredValue(drivers.get(sessionResult.driver_number), 'Driver ' + sessionResult.driver_number);
      const duration = Array.isArray(sessionResult.duration) ? sessionResult.duration : [];
      const latestQ = duration.length > 0 ? (duration.toReversed().find(isTruthy) ?? 0) * 1000 : undefined;
      return filterUndefined({
        driver,
        position: sessionResult.position,
        duration: latestQ,
      });
    }),
  };
};

export function map(source: OpenF1QualifyParams): IQualifyResult {
  return openF1Map(source);
}

