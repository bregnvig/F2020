import { Bid, calculateInterimResult, IRace, Player, validateInterimResult } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { log } from 'firebase-functions/logger';
import { CallableRequest, onCall } from 'firebase-functions/v2/https';
import { aiGeneratedRoast, collectionPaths, currentSeason, documentPaths, escapeHtml, getCurrentRace, internalError, logAndCreateError, raceLink, resultMail, Roast, roastSections, sendMail, sendNotification, standingsTable, validateAccess } from '../../lib';

/** Driver ids are e.g. max_verstappen */
const driverName = (driverId?: string) => driverId?.replace(/_/g, ' ') ?? 'ingen';

const describe = (result: Partial<Bid>) => (bids: Partial<Bid>[]) => bids
  .map(bid => `${bid.player?.displayName} med ${bid.points} point. Gættede kvalifikationen ${bid.qualify?.slice(0, 6).map(driverName).join(', ')}`
    + ` og ramte ${bid.qualifyPoints?.filter(p => p > 0).length ?? 0} af dem`)
  .join('\n') + `\nDen rigtige kvalifikation blev ${result.qualify?.slice(0, 6).map(driverName).join(', ')}`;

const mailBody = (player: Player, race: IRace, results: Partial<Bid>[], roast?: Roast): string => resultMail(
  player,
  `Mellemresultatet for ${escapeHtml(race.name)} er klart. Indtil videre ser det ca. sådan her ud`,
  standingsTable(player, results) + roastSections(roast, '🏆 I front', '🐌 Bagerst'),
  raceLink(race.season, race.round),
);

const messageBody = (player: Player, results: Partial<Bid>[]): string => {
  const index = results.findIndex(r => r.player?.uid === player.uid);
  return `Og du ligger på en foreløbig ${index + 1}. plads!`;
};

export const submitInterimResult = onCall(async (request: CallableRequest<Bid>) => {
  return validateAccess(request.auth?.uid, 'admin')
    .then(() => buildResult(request.data))
    .then(() => true)
    .catch(internalError);
});

const buildResult = async (result: Partial<Bid>) => {
  const season = await currentSeason();
  const race = await getCurrentRace('closed');

  if (!season || !race) {
    throw logAndCreateError('not-found', 'Season or race', season?.name, race?.name);
  }

  try {
    validateInterimResult(result, race);
  } catch (error) {
    throw logAndCreateError('failed-precondition', error.message);
  }

  const db = getFirestore();
  const calculatedResults: Partial<Bid>[] = await db.collection(collectionPaths.bids(race.season, race.round)).where('submitted', '==', true).get()
    .then(snapshot => snapshot.docs)
    .then(snapshots => snapshots.map(s => s.data()))
    .then(bids => bids.map(bid => calculateInterimResult(bid as Bid, result)))
    .then(bids => bids.sort((a, b) => b.points! - a.points!));

  await db.runTransaction(transaction => {
    calculatedResults.forEach(cr => {
      transaction.set(db.doc(documentPaths.bid(race.season, race.round, cr.player.uid)), cr);
    });
    transaction.update(db.doc(documentPaths.race(race.season, race.round)), { result });
    return Promise.resolve(`Interim result submitted`);
  }).then(async () => {
    const players = calculatedResults.map(cr => cr.player!);
    const roast = await aiGeneratedRoast(`mellemresultatet efter kvalifikationen i ${race.name}`, calculatedResults, describe(result));
    return Promise.all(players.map(async player => {
      log(`Should mail to ${player.displayName}`);
      await sendMail(player.email, `Så er der mellemresultat for ${race.name}`, mailBody(player, race, calculatedResults, roast));
      if (player.tokens && player.tokens.length) {
        log(`Should send notification to ${player.displayName}`);
        await sendNotification(player.tokens, `Mellemresultat for ${race.name}`, messageBody(player, calculatedResults), { link: raceLink(race.season, race.round) });
      } else {
        log('No tokens to send notifications to');
      }
    }));
  });
};
