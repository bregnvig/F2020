import { log } from 'firebase-functions/logger';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { DateTime } from 'luxon';
import { getCurrentRace, updateRace } from '../../lib';


// This will be run every hour!
export const closeRaceCrontab = onSchedule({
  timeZone: 'Europe/Copenhagen',
  schedule: '0 * * * *',
}, async () => getCurrentRace('open')
  .then(async race => {
    if (race) {
      log(`Is ${race.name} closed`, race.close <= DateTime.local());
      if (race.close <= DateTime.local()) {
        return updateRace(race.season, race.round, { state: 'closed' });
      }
      return Promise.resolve(undefined);
    } else {
      log('No open race found');
    }
  }),
);
