import { beforeEach, describe, expect, it } from 'vitest';
import { call, expectError } from '../../test/functions';
import { players, readTransactions, writePlayers } from '../../test/fixtures';
import { transfer } from './transfer.call';

const data = (data: Partial<Parameters<typeof transfer.run>[0]['data']> = {}) => ({
  fromUid: players.player.uid,
  toUid: players.admin.uid,
  amount: 100,
  message: 'Hello',
  ...data,
});

describe('transfer', () => {
  beforeEach(() => writePlayers('player', 'admin', 'bankAdmin'));

  it('should deny a transfer, when no one is logged in', async () => {
    await expectError(call(transfer, data()), 'unauthenticated');
  });

  it('should deny a transfer, when the user is unknown', async () => {
    await expectError(call(transfer, data(), 'unknown-uid'), 'not-found');
  });

  it('should deny a transfer, when the user is not a bank admin', async () => {
    await expectError(call(transfer, data(), players.admin.uid), 'permission-denied');
  });

  it('should deny a transfer, when the amount is missing or zero', async () => {
    await expectError(call(transfer, data({ amount: 0 }), players.bankAdmin.uid), 'failed-precondition');
  });

  it('should deny a transfer, when the amount is negative', async () => {
    await expectError(call(transfer, data({ amount: -100 }), players.bankAdmin.uid), 'failed-precondition');
  });

  it('should deny a transfer, when the from player is unknown', async () => {
    await expectError(call(transfer, data({ fromUid: 'unknown-uid' }), players.bankAdmin.uid), 'not-found');
  });

  it('should deny a transfer, when the to player is unknown', async () => {
    await expectError(call(transfer, data({ toUid: 'unknown-uid' }), players.bankAdmin.uid), 'not-found');
  });

  it('should deny a transfer, when the from and to players are the same', async () => {
    await expectError(call(transfer, data({ toUid: players.player.uid }), players.bankAdmin.uid), 'failed-precondition');
  });

  it('should deny a transfer, when the from player does not have enough money', async () => {
    await expectError(call(transfer, data({ amount: 201 }), players.bankAdmin.uid), 'failed-precondition');
  });

  it('should transfer the amount between the players', async () => {
    expect(await call(transfer, data(), players.bankAdmin.uid)).toBe(true);
    expect(await readTransactions()).toEqual([
      { amount: 100, message: 'Hello', from: players.player.uid, to: players.admin.uid, involved: [players.player.uid, players.admin.uid] },
    ]);
  });
});
