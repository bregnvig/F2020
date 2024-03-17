import { Bid, IRace, Player } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { Change, region } from 'firebase-functions/v1';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { DateTime } from 'luxon';
import { documentPaths, getCurrentRace, playerWithoutBid } from '../../lib';
import { converter } from '../../lib/timestamp.converter';
import { sendNotification } from './../../lib';

const messageBody = (race: IRace, player: Player): string =>
  `${player.displayName} har lige afgivet sit bud til ${race.name}, og du har ikke spillet endnu😱`;


export const almostTimeTrigger = region('europe-west1').firestore.document('seasons/{seasonId}/races/{round}/bids/{bid}')
  .onWrite(async (change: Change<DocumentSnapshot>) => {
    const before = change.before?.data() as Bid;
    const after = change.after.data() as Bid;
    const race = await getCurrentRace('open');
    if (race?.close.diffNow('hours').hours < 1 && !before?.submitted && after.submitted === true) {
      await almostTimeReminder(race, after.player);
    }
    return Promise.resolve(true);
  });

const almostTimeReminder = async (race: IRace, player: Player) => {
  const players = (await playerWithoutBid())
    .filter(p => p.tokens?.length)
    .filter(p => !p.almostTimeReminder || (p.almostTimeReminder.diffNow('hours').hours > 24));

  players.forEach(p => sendNotification(p.tokens, `${Math.floor(race.close.diffNow('minutes').minutes)} minutter tilbage`, messageBody(race, player)));

  const db = getFirestore();

  return db.runTransaction(transaction => {
    players.forEach(({ uid }) => transaction.update(db.doc(documentPaths.player(uid)), converter.toFirestore({ almostTimeReminder: DateTime.now() })));
    return Promise.resolve();
  });
};
