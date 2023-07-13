import { getClient } from './axios';
import { ErgastSeason } from '@f2020/data';

export const getSeason = async (seasonId: string): Promise<ErgastSeason> => {
  return getClient().get(`${seasonId}.json`)
    .then(result => result.data.MRData.RaceTable);
};

