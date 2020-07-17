import { validateResult } from './../../lib/validate.service';
import * as functions from 'firebase-functions';
import { internalError, validateAccess, Bid, ITeam, logAndCreateError, seasonsURL, racesURL, currentSeason, getCurrentRace, getBookie, calculateResult, transferInTransaction } from '../../lib';
import admin = require('firebase-admin');
import { DateTime } from 'luxon';

export const submitResult = functions.region('europe-west1').https.onCall(async (data: Bid, context) => {
  return validateAccess(context.auth?.uid, 'admin')
    .then(player => buildResult(data))
    .then(() => true)
    .catch(internalError);
});

const buildResult = async (result: Bid) => {
  const season = await currentSeason();
  const race = await getCurrentRace('closed');
  const bookie = await getBookie();

  if (!season || !race) {
    throw logAndCreateError('not-found', 'Season or race', season?.name, race?.name);
  }

  const db = admin.firestore();
  const team: ITeam | undefined = race.selectedTeam ? (await db.doc(`${seasonsURL}/${season.id}/teams/${race.selectedTeam}`).get()).data() as ITeam : undefined;

  validateResult(result, race, team);

  const calculatedResults: Bid[] = await db.collection(`${seasonsURL}/${race.season}/${racesURL}/${race.round}/bids`).where('submitted', '==', true).get()
    .then(snapshot => snapshot.docs)
    .then(snapshots => snapshots.map(s => s.data()))
    .then(bids => bids.map(bid => calculateResult(bid as Bid, result)))
    .then(bids => bids.sort((a, b) => b.points! - a.points!));

  const winners = calculatedResults.filter(r => r.points! === calculatedResults[0].points!);
  const winningPrice = Math.floor(calculatedResults.length * 20 / winners.length);

  return db.runTransaction(transaction => {
    winners.forEach(winner => {
      transferInTransaction({
        date: DateTime.local(),
        amount: winningPrice,
        message: `Gevinst ${race.name}`,
        from: bookie.uid,
        to: winner.player!.uid,
        involved: [bookie.uid, winner.player!.uid],
      }, transaction);
    });
    calculatedResults.forEach(cr => {
      transaction.set(db.doc(`${seasonsURL}/${race.season}/${racesURL}/${race.round}/bids/${cr.player!.uid}`), cr);
    });
    transaction.update(db.doc(`${seasonsURL}/${race.season}/${racesURL}/${race.round}`), { state: 'completed', result })
    return Promise.resolve(`Result submitted`);
  });


}
