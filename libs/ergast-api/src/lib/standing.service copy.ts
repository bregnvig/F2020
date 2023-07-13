import { ErgastDriverStanding } from "@f2020/data";
import { getClient } from "./axios";

export const getDriverStandings = async (seasonId: string): Promise<ErgastDriverStanding[]> => {
  return getClient().get<any>(`${seasonId}/driverStandings.json`)
    .then(({ data }) => (data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? []) as ErgastDriverStanding[]);
};