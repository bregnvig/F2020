import { Bid } from '@f2020/data';
import { deepCompareFn } from '@f2020/tools';
import { log } from 'firebase-functions/logger';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { documentPaths } from '../../lib';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

/**
 * Updates the updatedAt property for the bid and the participant.
 * Make sure the bid is different from the previous bid.
 * And that a minimum of 10 seconds has passed since the last update.
 */
export const updatedAtTrigger = onDocumentUpdated('seasons/{seasonId}/races/{raceId}/bids/{userId}', async event => {
  const before = event.data.before.data() as Bid;
  const after = event.data.after.data() as Bid;
  const compare = deepCompareFn(new Set<string>(['updatedAt']));
  const equal = compare(before, after);
  const resentlyUpdated = (event.data.after.updateTime.toMillis() - event.data.before.updateTime.toMillis()) < 10000;
  const alreadySubmitted = before.submitted && after.submitted;
  log('Update at trigger', { equal, resentlyUpdated, alreadySubmitted });

  if (equal || resentlyUpdated || alreadySubmitted) {
    return Promise.resolve('No reason to update timestamp');
  }

  const db = getFirestore();
  const participant = db.doc(documentPaths.participant(
    event.params['seasonId'],
    event.params['raceId'],
    after.player.uid,
  ));
  return db.runTransaction(transaction => {
    const payload = { updatedAt: Timestamp.now() };
    transaction
      .update(event.data.after.ref, payload)
      .update(participant, payload)
    ;
    return Promise.resolve('Updated timestamp');
  });
});
