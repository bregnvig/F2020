import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { getFirestore } from 'firebase-admin/firestore';
import { beforeEach, describe, it } from 'vitest';
import { players, writePlayers } from '../../test/fixtures';
import { rulesTestEnvironment } from '../../test/rules';

const firestoreAs = rulesTestEnvironment();

const transaction = (from: string, to: string) => ({ from, to, involved: [from, to], amount: 20, message: 'Hello', date: new Date() });

const involving = (uid: string) => (db: ReturnType<typeof firestoreAs>) => db.collection('transactions').where('involved', 'array-contains', uid).get();

describe('transaction rules', () => {
  beforeEach(async () => {
    await writePlayers('admin', 'player', 'bookie', 'bankAdmin');
    const transactions = getFirestore().collection('transactions');
    await transactions.doc('1').set(transaction(players.player.uid, players.bookie.uid));
    await transactions.doc('2').set(transaction(players.bankAdmin.uid, players.bookie.uid));
  });

  it('should let an admin read every transaction, but not change them', async () => {
    const db = firestoreAs(players.admin.uid);
    await assertSucceeds(db.collection('transactions').get());
    await assertFails(db.doc('transactions/1').update({ amount: 9999 }));
    await assertFails(db.doc('transactions/3').set(transaction(players.admin.uid, players.bookie.uid)));
  });

  it.each([
    ['player', players.player.uid],
    ['bookie', players.bookie.uid],
    ['bank admin', players.bankAdmin.uid],
  ])('should let a %s read their own transactions, but not change them', async (_, uid) => {
    const db = firestoreAs(uid);
    await assertSucceeds(involving(uid)(db));
    await assertFails(involving(players.admin.uid)(db));
    await assertFails(db.collection('transactions').get());
    await assertFails(db.doc('transactions/1').update({ amount: 9999 }));
    await assertFails(db.doc('transactions/3').set(transaction(uid, players.bookie.uid)));
  });

  it('should not let a player read the transactions of others', async () => {
    await assertFails(firestoreAs(players.player.uid).doc('transactions/2').get());
  });

  it('should not let someone who is not a player read transactions', async () => {
    await assertFails(firestoreAs('non-player-uid').collection('transactions').get());
  });
});
