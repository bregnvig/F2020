import { ErgastRaceResult, ErgastDriversQualifying } from "@f2020/data";
import { getClient } from './axios';


export const getRaceResults = async (seasonId: string): Promise<ErgastRaceResult[]> => {
  return getClient().get(`/${seasonId}/results.json?limit=1000`)
    .then(result => result.data)
    .then(data => data.MRData.RaceTable.Races);
};

export const getQualifyResults = async (seasonId: string): Promise<ErgastDriversQualifying[]> => {
  return getClient().get(`/${seasonId}/qualifying.json?limit=1000`)
    .then(result => result.data)
    .then(data => data.MRData.RaceTable.Races);
};
