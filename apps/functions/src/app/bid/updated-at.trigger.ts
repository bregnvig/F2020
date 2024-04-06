import { Change, EventContext, region } from 'firebase-functions';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { Bid } from '@f2020/data';
import { deepCompareFn } from '@f2020/tools';
import { log } from 'firebase-functions/logger';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { documentPaths } from '../../lib';

/**
 * Updates the updatedAt property for the bid and the participant.
 * Make sure the bid is different from the previous bid.
 * And that a minimum of 10 seconds has passed since the last update.
 */
export const updatedAtTrigger = region('europe-west1').firestore.document('seasons/{seasonId}/races/{raceId}/bids/{userId}')
  .onUpdate(async (change: Change<DocumentSnapshot>, context: EventContext) => {
    const before = change.before.data() as Bid;
    const after = change.after.data() as Bid;
    const compare = deepCompareFn(new Set<string>(['updatedAt']));
    const equal = compare(before, after);
    const resentlyUpdated = (change.after.updateTime.toMillis() - change.before.updateTime.toMillis()) < 10000;
    const alreadySubmitted = before.submitted && after.submitted;
    log('Update at trigger', { equal, resentlyUpdated, alreadySubmitted });

    if (equal || resentlyUpdated || alreadySubmitted) {
      return Promise.resolve('No reason to update timestamp');
    }

    const db = getFirestore();
    const participant = db.doc(documentPaths.participant(
      context.params['seasonId'],
      context.params['raceId'],
      after.player.uid,
    ));
    return db.runTransaction(transaction => {
      const payload = { updatedAt: Timestamp.now() };
      transaction
        .update(change.after.ref, payload)
        .update(participant, payload)
      ;
      return Promise.resolve('Updated timestamp');
    });
  });
