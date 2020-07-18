import { ErgastConstructorStanding, ErgastDriver, ITeam } from '../model';
import { getByNationality } from './countries';
import { drivers as driversMapper } from './driver.mapper';

export const team = (source: ErgastConstructorStanding, drivers: ErgastDriver[]): ITeam => {
  return {
    constructorId: source.Constructor.constructorId,
    name: source.Constructor.name,
    url: source.Constructor.url,
    countryCode: getByNationality(source.Constructor.nationality),
    drivers: driversMapper(drivers || []).map(d => d.driverId),
    points: parseInt(source.points, 10)
  };
};