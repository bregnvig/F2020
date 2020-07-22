import * as functions from 'firebase-functions';
import { Bid, currentSeason, getCurrentRace, internalError, logAndCreateError, racesURL, seasonsURL, validateAccess } from '../../lib';
import { calculateInterimResult } from './../../lib/result.service';
import { validateInterimResult } from './../../lib/validate.service';
import admin = require('firebase-admin');

export const submitInterimResult = functions.region('europe-west1').https.onCall(async (data: Partial<Bid>, context) => {
  return validateAccess(context.auth?.uid, 'admin')
    .then(player => buildResult(data))
    .then(() => true)
    .catch(internalError);
});

const buildResult = async (result: Partial<Bid>) => {
  const season = await currentSeason();
  const race = await getCurrentRace('closed');

  if (!season || !race) {
    throw logAndCreateError('not-found', 'Season or race', season?.name, race?.name);
  }

  validateInterimResult(result, race);
  
  const db = admin.firestore();
  const calculatedResults: Partial<Bid>[] = await db.collection(`${seasonsURL}/${race.season}/${racesURL}/${race.round}/bids`).where('submitted', '==', true).get()
  .then(snapshot => snapshot.docs)
  .then(snapshots => snapshots.map(s => s.data()))
  .then(bids => bids.map(bid => calculateInterimResult(bid as Bid, result)))
  .then(bids => bids.sort((a, b) => b.points! - a.points!));
  
  return db.runTransaction(transaction => {
    calculatedResults.forEach(cr => {
      transaction.set(db.doc(`${seasonsURL}/${race.season}/${racesURL}/${race.round}/bids/${cr.player!.uid}`), cr);
    });
    return Promise.resolve(`Interim result submitted`);
  });
}
