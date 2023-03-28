import { IRace, ISeason } from '@f2020/data';
import * as admin from 'firebase-admin';
import { Change, EventContext, region } from 'firebase-functions/v1';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { seasonsURL } from '../../lib';
;

const db = admin.firestore();

/**
 * The structure for the WBC is:
 * seasons/{seasonId} wbc[] - {round}: {race, players[]}
 */
export const rollbackWBCTrigger = region('europe-west1').firestore.document('seasons/{seasonId}/races/{round}')
  .onUpdate(async (change: Change<DocumentSnapshot>, context: EventContext) => {
    const before: IRace = change.before.data() as IRace;
    const after: IRace = change.after.data() as IRace;
    if (before.state === 'completed' && after.state === 'closed') {
      await rollbackWBCRace(after, db.doc(`${seasonsURL}/${context.params.seasonId}`));
    }
    return Promise.resolve(true);
  });

const rollbackWBCRace = async (race: IRace, ref: admin.firestore.DocumentReference) => {

  ref.get()
    .then(doc => doc.data())
    .then((season: ISeason) => {
      (season.wbc?.results ?? []).splice(race.round - 1, 1);
      return season.wbc?.results ?? [];
    })
    .then(results => ref.set({
      wbc: {
        results
      }
    }, { merge: true }));
};
