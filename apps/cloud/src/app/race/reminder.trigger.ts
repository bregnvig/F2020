import { Bid, IRace, Player } from '@f2020/data';
import { firestore } from 'firebase-admin';
import { Change, EventContext, region } from 'firebase-functions/v1';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { DateTime } from 'luxon';
import { getCurrentRace, playerWithoutBid } from '../../lib';
import { converter } from '../../lib/timestamp.converter';
import { sendNotification } from './../../lib';

const messageBody = (race: IRace, player: Player): string =>
  `${player.displayName} har lige afgivet sit bud til ${race.name}, og du har ikke spillet endnu😱`;


export const almostTimeTrigger = region('europe-west1').firestore.document('seasons/{seasonId}/races/{round}/bids/{bid}')
  .onUpdate(async (change: Change<DocumentSnapshot>, context: EventContext) => {
    const before = change.before.data() as Bid;
    const after = change.after.data() as Bid;
    const race = await getCurrentRace('open');
    if (race?.close.diffNow('hours').hours < 1 && before.submitted === false && after.submitted === true) {
      await almostTimeReminder(race, after.player);
    }
    return Promise.resolve(true);
  });

const almostTimeReminder = async (race: IRace, player: Player) => {
  const players = (await playerWithoutBid())
    .filter(p => p.tokens?.length)
    .filter(p => p.almostTimeReminder?.diffNow('hours').hours > 24);

  players.forEach(p => sendNotification(p.tokens, `${race.close.diffNow('minutes').minutes} minutter tilbage`, messageBody(race, player)));

  const db = firestore();
  return db.runTransaction(transaction => {
    players.forEach(({ uid }) => transaction.update(db.doc(`players/${uid}`), converter.toFirestore({ almostTimeReminder: DateTime.now() })));
    return Promise.resolve();
  });
};