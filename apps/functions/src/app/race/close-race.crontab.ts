import { DateTime } from 'luxon';
import { getCurrentRace, logAndCreateError, updateRace } from '../../lib';
import { log } from 'firebase-functions/logger';
import { onSchedule } from 'firebase-functions/v2/scheduler';


// This will be run every friday at 11.00 Europe/Copenhagen!
export const closeRaceCrontab = onSchedule({
    timeZone: 'Europe/Copenhagen',
    schedule: '0 11 * * *',
  }, async () => getCurrentRace('open')
    .then(async race => {
      if (race) {
        log(`Is ${race.name} closed`, race.close <= DateTime.local());
        if (race.close <= DateTime.local()) {
          return updateRace(race.season, race.round, { state: 'closed' });
        }
        return Promise.resolve(undefined);
      }
      throw logAndCreateError('not-found', 'No race');
    }),
);
