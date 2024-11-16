import { ErgastDriver, IDriver } from '../model';
import { Driver as OpenF1Driver } from '@f2020/openf1';
import { countryCode3ToCountryCode2, getByNationality } from './countries';
import { requiredValue, StringUtils } from '@f2020/tools';


export function driver(d: OpenF1Driver): IDriver;
export function driver(d: ErgastDriver): IDriver;
export function driver(d: ErgastDriver | OpenF1Driver): IDriver {
  return 'driverId' in d
    ? {
      driverId: d.driverId.trim(),
      code: d.code,
      nationality: d.nationality,
      countryCode: getByNationality(d.nationality),
      name: `${d.givenName} ${d.familyName}`,
      permanentNumber: parseInt(d.permanentNumber, 10),
      url: d.url,
    }
    : {
      driverId: d.name_acronym.toLocaleLowerCase(),
      code: d.name_acronym,
      countryCode: countryCode3ToCountryCode2[d.country_code] ?? d.country_code,
      headshotUrl: d.headshot_url,
      name: StringUtils.titleCase(d.full_name),
      permanentNumber: d.driver_number,
      teamColor: d.team_colour,
      teamName: d.team_name,
    };
}

export const drivers = (_drivers: ErgastDriver[] | OpenF1Driver[]) => _drivers.map(driver);

export const joinDrivers = (openF1: IDriver[], drivers: IDriver[]) => {
  return openF1.map(d => requiredValue(drivers.find(({ code, permanentNumber }) => d.code === code && d.permanentNumber === permanentNumber), 'Firestore Driver'));
};
