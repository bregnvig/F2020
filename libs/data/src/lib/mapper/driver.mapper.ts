import { ErgastDriver, IDriver } from '../model';
import { getByNationality } from './countries';

export const driver = (d: ErgastDriver): IDriver => {
  return {
    driverId: d.driverId,
    code: d.code,
    nationality: d.nationality,
    countryCode: getByNationality(d.nationality) ?? null,
    name: `${d.givenName} ${d.familyName}`,
    permanentNumber: parseInt(d.permanentNumber, 10),
    url: d.url
  };
};

export const drivers = (_drivers: ErgastDriver[]) => _drivers.map(driver);
