import { getFirestore } from 'firebase-admin/firestore';
import { beforeEach, describe, expect, it } from 'vitest';
import { call, expectError } from '../../test/functions';
import { players, writePlayers } from '../../test/fixtures';
import { migrateAccount } from './migrate-account.call';

const uid = players.player.uid;

const readTransaction = (id: string) =>
  getFirestore()
    .doc(`transactions/${id}`)
    .get()
    .then(snapshot => snapshot.data()!);

describe('migrate account', () => {
  beforeEach(async () => {
    await writePlayers('player', 'admin', 'bankAdmin');
    const transactions = getFirestore().collection('transactions');
    await transactions.doc('1').set({ from: 'flb', to: null, involved: ['flb'], amount: 100, date: new Date() });
    await transactions.doc('2').set({ from: 'flb', to: 'mba', involved: ['flb', 'mba'], amount: 100, date: new Date() });
    await transactions.doc('3').set({ from: null, to: 'flb', involved: ['flb'], amount: 100, date: new Date() });
    await transactions.doc('4').set({ from: 'mba', to: 'flb', involved: ['flb', 'mba'], amount: 100, date: new Date() });
    await transactions.doc('5').set({ from: 'mba', to: null, involved: ['mba'], amount: 100, date: new Date() });
  });

  it('should deny a migration, when no one is logged in', async () => {
    await expectError(call(migrateAccount, { uid, playerName: 'flb' }), 'unauthenticated');
  });

  it('should deny a migration, when the user is not a bank admin', async () => {
    await expectError(call(migrateAccount, { uid, playerName: 'flb' }, players.admin.uid), 'permission-denied');
  });

  it('should move the transactions of the old account to the player', async () => {
    expect(await call(migrateAccount, { uid, playerName: 'flb' }, players.bankAdmin.uid)).toBe(true);
    expect(await readTransaction('1')).toMatchObject({ from: uid, to: null, involved: [uid] });
    expect(await readTransaction('2')).toMatchObject({ from: uid, to: 'mba', involved: [uid, 'mba'] });
    expect(await readTransaction('3')).toMatchObject({ from: null, to: uid, involved: [uid] });
    expect(await readTransaction('4')).toMatchObject({ from: 'mba', to: uid, involved: [uid, 'mba'] });
    expect(await readTransaction('5')).toMatchObject({ from: 'mba', to: null, involved: ['mba'] });
  });
});
