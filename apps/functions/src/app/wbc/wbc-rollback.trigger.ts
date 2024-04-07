import { IRace, ISeason } from '@f2020/data';
import { DocumentReference, getFirestore } from 'firebase-admin/firestore';
import { documentPaths } from '../../lib';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

/**
 * The structure for the WBC is:
 * seasons/{seasonId} wbc[] - {round}: {race, players[]}
 */
export const rollbackWBCTrigger = onDocumentUpdated('seasons/{seasonId}/races/{round}', async event => {
  const db = getFirestore();
  const before: IRace = event.data.before.data() as IRace;
  const after: IRace = event.data.after.data() as IRace;
  if (before.state === 'completed' && after.state === 'closed') {
    await rollbackWBCRace(after, db.doc(documentPaths.season(event.params.seasonId)));
  }
  return Promise.resolve(true);
});

const rollbackWBCRace = async (race: IRace, ref: DocumentReference) => {

  ref.get()
    .then(doc => doc.data())
    .then((season: ISeason) => {
      (season.wbc?.results ?? []).splice(race.round - 1, 1);
      return season.wbc?.results ?? [];
    })
    .then(results => ref.set({
      wbc: {
        results,
      },
    }, { merge: true }));
};
