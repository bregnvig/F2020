import { ErgastSeason, ISeason } from '../model';
import { DateTime } from 'luxon';

export const map = (season: ErgastSeason, latestWBCJoinDate: DateTime): ISeason => {
  return {
    name: `F${season.season}`,
    id: season.season,
    wbc: {
      latestWBCJoinDate
    }
  }
};
