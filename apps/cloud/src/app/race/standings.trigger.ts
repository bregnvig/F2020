import { IRace } from '@f2020/data';
import { firestore } from 'firebase-admin';
import { Change, region } from 'firebase-functions/v1';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { getDriverStandings } from '../../lib/standing.service';

const db = firestore();

/**
 * This trigger opens the next race, when the previous completes.
 * Since rollback we need to determine if we really should open the next race
 */
export const standingTrigger = region('europe-west1').firestore.document('seasons/{seasonId}/races/{round}')
  .onUpdate(async (change: Change<DocumentSnapshot>) => {
    const before: IRace = change.before.data() as IRace;
    const after: IRace = change.after.data() as IRace;

    await getDriverStandings('2023');

  });