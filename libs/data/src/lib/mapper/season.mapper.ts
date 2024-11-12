import { ISeason } from '../model';
import { DateTime } from 'luxon';

export const map = (seasonId: number | string, latestWBCJoinDate: DateTime): ISeason => {
  return {
    name: `F${seasonId}`,
    current: false,
    id: seasonId.toString(10),
    wbc: {
      latestWBCJoinDate,
    },
  };
};
