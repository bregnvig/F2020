import { IDriver } from '../model';
import { Driver as OpenF1Driver } from '@f2020/openf1';
import { countryCode3ToCountryCode2 } from './countries';
import { requiredValue, StringUtils } from '@f2020/tools';

export function driver(d: OpenF1Driver): IDriver {
  return {
    driverId: d.name_acronym.toLocaleLowerCase(),
    code: d.name_acronym,
    countryCode: countryCode3ToCountryCode2[d.country_code] ?? d.country_code,
    headshotUrl: d.headshot_url,
    name: StringUtils.titleCase(d.full_name),
    permanentNumber: [d.driver_number],
    teamColor: d.team_colour,
    teamName: d.team_name,
  };
}

export const drivers = (_drivers: OpenF1Driver[]) => _drivers.map(driver);

export const joinDrivers = (openF1: IDriver[], drivers: IDriver[]) => {
  return openF1.map(d => requiredValue(drivers.find(({ code }) => d.code === code), 'Firestore Driver'));
};
