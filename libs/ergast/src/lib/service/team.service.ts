import { ErgastConstructorStanding, ErgastDriver } from '@f2020/data';
import { getClient } from './axios';

export const getContructorStandings = async (seasonId: string | number): Promise<ErgastConstructorStanding[]> => {

  const http = getClient();

  return http.get<any>(`/${seasonId}/constructorStandings.json`)
    .then(result => result.data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings);
};

export const getConstructorDrivers = async (seasonId: string | number, constructorId: string): Promise<ErgastDriver[]> => {
  const http = getClient();

  return http.get<any>(`/${seasonId}/constructors/${constructorId}/drivers.json`)
    .then(result => result.data.MRData.DriverTable.Drivers);

}; 