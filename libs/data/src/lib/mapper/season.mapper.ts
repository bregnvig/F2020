import { ISeason } from '../model';
import { DateTime } from 'luxon';

export const map = (seasonId: number, latestWBCJoinDate: DateTime): ISeason => {
  return {
    name: `F${seasonId}`,
    id: seasonId.toString(10),
    wbc: {
      latestWBCJoinDate,
    },
  };
};
