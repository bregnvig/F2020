import { Change, EventContext, region } from 'firebase-functions';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { getFirestore } from 'firebase-admin/lib/firestore';
import { Bid } from '@f2020/data';
import { documentPaths } from '../../lib';
import { Timestamp } from 'firebase-admin/firestore';

export const updatedAtTrigger = region('europe-west1').firestore.document('seasons/{seasonId}/races/{raceId}/bids/{userId}')
  .onUpdate(async (change: Change<DocumentSnapshot>, context: EventContext) => {
    const db = getFirestore();
    const bid = change.after.data() as Bid;
    const participant = db.doc(documentPaths.participant(
      context.params['seasonId'],
      context.params['raceId'],
      bid.player.uid,
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
