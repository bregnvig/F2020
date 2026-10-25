import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { beforeEach, describe, it } from 'vitest';
import { players, writePlayers } from '../../test/fixtures';
import { rulesTestEnvironment } from '../../test/rules';

const firestoreAs = rulesTestEnvironment();
const player = `players/${players.player.uid}`;
const newPlayer = { uid: 'new-uid', displayName: 'New', roles: ['player'] };

describe('player rules', () => {
  beforeEach(() => writePlayers('admin', 'player', 'player1', 'bookie', 'bankAdmin'));

  it('should let an admin change other players, but not their balance or uid', async () => {
    const db = firestoreAs(players.admin.uid);
    await assertSucceeds(db.doc(player).get());
    await assertSucceeds(db.doc(player).update({ displayName: 'Mickey Mouse' }));
    await assertSucceeds(db.doc(player).update({ roles: ['player', 'admin'] }));
    await assertFails(db.doc(player).update({ balance: 9999 }));
    await assertFails(db.doc(player).update({ uid: 'other-uid' }));
    await assertSucceeds(db.doc('players/new-uid').set(newPlayer));
    await assertSucceeds(db.doc(player).delete());
  });

  it('should let a player change themselves, but not their balance, uid or roles', async () => {
    const db = firestoreAs(players.player.uid);
    await assertSucceeds(db.doc(player).get());
    await assertSucceeds(db.doc(player).update({ displayName: 'Mickey Mouse', email: 'mickey@example.com', receiveReminders: false }));
    await assertFails(db.doc(player).update({ balance: 9999 }));
    await assertFails(db.doc(player).update({ uid: 'other-uid' }));
    await assertFails(db.doc(player).update({ roles: ['player', 'admin'] }));
    await assertFails(db.doc(player).delete());
  });

  it('should not let a player read or change other players', async () => {
    const db = firestoreAs(players.player1.uid);
    await assertFails(db.doc(player).get());
    await assertFails(db.doc(player).update({ displayName: 'Mickey Mouse' }));
    await assertFails(db.doc('players/new-uid').set(newPlayer));
  });

  it.each([
    ['bookie', players.bookie.uid],
    ['bank admin', players.bankAdmin.uid],
  ])('should not let a %s change other players', async (_, uid) => {
    const db = firestoreAs(uid);
    await assertFails(db.doc(player).update({ displayName: 'Mickey Mouse' }));
    await assertFails(db.doc(player).update({ balance: 9999 }));
    await assertFails(db.doc(player).delete());
  });

  it('should let a new user create themselves, but not with roles or a balance', async () => {
    const db = firestoreAs('new-uid');
    await assertFails(db.doc('players/new-uid').set(newPlayer));
    await assertFails(db.doc('players/new-uid').set({ uid: 'new-uid', displayName: 'New', balance: 1000 }));
    await assertSucceeds(db.doc('players/new-uid').set({ uid: 'new-uid', displayName: 'New' }));
  });

  it('should not let someone who is not a player list the players', async () => {
    await assertFails(firestoreAs('non-player-uid').collection('players').get());
  });
});
