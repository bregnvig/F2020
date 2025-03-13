import { onSchedule } from 'firebase-functions/v2/scheduler';
import { DateTime } from 'luxon';
import { getCurrentRace, updateRace } from '../../lib';
import { logger } from 'firebase-functions';


// This will be run every hour!
export const closeRaceCrontab = onSchedule({
    timeZone: 'Europe/Copenhagen',
    schedule: '0 * * * *',
  }, async () => {
    const race = await getCurrentRace('open');
    if (race) {
      logger.info(`Is ${race.name} closed`, race.close <= DateTime.local());
      if (race.close <= DateTime.local()) {
        return updateRace(race.season, race.round, { state: 'closed' });
      }
      return Promise.resolve(undefined);
    } else {
      logger.info('No open race found');
    }
  },
);
