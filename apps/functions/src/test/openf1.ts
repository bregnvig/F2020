import { Driver } from '@f2020/openf1';

/** A driver as OpenF1 has it */
export const openF1Driver = (name_acronym: string, driver_number: number, team_name: string, country_code = 'GBR'): Driver =>
  ({
    name_acronym,
    driver_number,
    team_name,
    country_code,
    full_name: `${name_acronym} DRIVER`,
    headshot_url: `https://example.com/${name_acronym}.png`,
    team_colour: '000000',
  }) as Driver;

export const openF1Drivers = [
  openF1Driver('RUS', 63, 'Mercedes'),
  openF1Driver('ANT', 12, 'Mercedes', 'ITA'),
  openF1Driver('LEC', 16, 'Ferrari', 'MCO'),
  openF1Driver('HAM', 44, 'Ferrari'),
];
