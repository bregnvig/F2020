import { pubsub } from 'firebase-functions/v1';
import { DateTime } from 'luxon';
import { getCurrentRace, logAndCreateError, updateRace } from '../../lib';
import { log } from 'firebase-functions/logger';
;

// This will be run every friday at 10.00 Europe/Copenhagen!
export const closeRaceCrontab = pubsub.schedule('0 11 * * *')
  .timeZone('Europe/Copenhagen')
  .onRun(async () => getCurrentRace('open')
    .then(async race => {
      log(`Is ${race!.name} closed`, race!.close <= DateTime.local());
      if (race!.close <= DateTime.local()) {
        return updateRace(race!.season, race!.round, { state: 'closed' });
      }
      return Promise.resolve(true);
    })
    .catch(() => {
      throw logAndCreateError('not-found', 'No race');
    })
  );