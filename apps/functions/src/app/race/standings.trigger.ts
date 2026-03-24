import { IRace } from '@f2020/data';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { setStandings } from '../../lib';

/**
 * This trigger fetches the current standing for all drivers and for each driver.
 * For each driver both result and qualify.
 */
export const standingTrigger = onDocumentUpdated('seasons/{seasonId}/races/{round}', async event => {
  const before: IRace = event.data.before.data() as IRace;
  const after: IRace = event.data.after.data() as IRace;

  if (before.state !== 'completed' && after.state === 'completed') {
    await setStandings(after);
  }
});
