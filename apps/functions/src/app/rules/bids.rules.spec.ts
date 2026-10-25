import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { DateTime } from 'luxon';
import { beforeEach, describe, it } from 'vitest';
import { bids, players, writeBid, writePlayers, writeRace } from '../../test/fixtures';
import { rulesTestEnvironment } from '../../test/rules';

const firestoreAs = rulesTestEnvironment();
const bid = (uid: string) => `seasons/9999/races/1/bids/${uid}`;

describe('bid rules', () => {
  beforeEach(async () => {
    await writePlayers('admin', 'player', 'player1', 'bookie');
    await writeRace(1, { state: 'open' });
  });

  it('should let a player create their own bid, while the race is open', async () => {
    await assertSucceeds(firestoreAs(players.player.uid).doc(bid(players.player.uid)).set(bids.player));
  });

  it('should not let a player create a bid, when the race has closed', async () => {
    await writeRace(1, { state: 'closed', close: DateTime.local().minus({ hours: 1 }).toJSDate() });
    await assertFails(firestoreAs(players.player.uid).doc(bid(players.player.uid)).set(bids.player));
  });

  it('should let a player change their bid until it is submitted', async () => {
    await writeBid(1, bids.player);
    const db = firestoreAs(players.player.uid);
    await assertSucceeds(db.doc(bid(players.player.uid)).update({ firstCrash: ['ham'] }));
    await assertFails(db.doc(bid(players.player.uid)).update({ submitted: true }));
  });

  it('should not let a player change a submitted bid', async () => {
    await writeBid(1, { ...bids.player, submitted: true });
    const db = firestoreAs(players.player.uid);
    await assertFails(db.doc(bid(players.player.uid)).update({ firstCrash: ['ham'] }));
    await assertFails(db.doc(bid(players.player.uid)).update({ submitted: false }));
  });

  it('should not let a player change the bid of another player', async () => {
    await writeBid(1, bids.admin);
    await assertFails(
      firestoreAs(players.player.uid)
        .doc(bid(players.admin.uid))
        .update({ firstCrash: ['ham'] }),
    );
  });

  it('should let a player who has submitted read the bids of others', async () => {
    await writeBid(1, { ...bids.admin, submitted: true });
    await writeBid(1, { ...bids.player, submitted: true });
    const db = firestoreAs(players.player.uid);
    await assertSucceeds(db.doc(bid(players.player.uid)).get());
    await assertSucceeds(db.doc(bid(players.admin.uid)).get());
  });

  it.each([
    ['without a bid', undefined],
    ['with a bid, as the app saves it before it is submitted', bids.player],
    ['with a bid that is not submitted', { ...bids.player, submitted: false }],
  ])('should not let a player %s read the bids of others, while the race is open', async (_, own) => {
    await writeBid(1, { ...bids.admin, submitted: true });
    if (own) {
      await writeBid(1, own);
    }
    await assertFails(firestoreAs(players.player.uid).doc(bid(players.admin.uid)).get());
  });

  it('should let every player read the bids, when the race has closed', async () => {
    await writeRace(1, { state: 'closed', close: DateTime.local().minus({ hours: 1 }).toJSDate() });
    await writeBid(1, { ...bids.admin, submitted: true });
    await assertSucceeds(firestoreAs(players.player1.uid).doc(bid(players.admin.uid)).get());
  });

  it.each([
    ['bookie', players.bookie.uid],
    ['non-player', 'non-player-uid'],
  ])('should not let a %s read bids', async (_, uid) => {
    await writeBid(1, { ...bids.admin, submitted: true });
    await assertFails(firestoreAs(uid).doc(bid(players.admin.uid)).get());
  });
});
