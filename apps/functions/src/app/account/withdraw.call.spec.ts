import { beforeEach, describe, expect, it } from 'vitest';
import { call, expectError } from '../../test/functions';
import { players, readTransactions, writePlayers } from '../../test/fixtures';
import { withdraw } from './withdraw.call';

describe('withdraw', () => {
  beforeEach(() => writePlayers('player', 'bankAdmin'));

  it('should deny a withdraw, when no one is logged in', async () => {
    await expectError(call(withdraw, { amount: 100, message: 'Hello', uid: players.player.uid }), 'unauthenticated');
  });

  it('should deny a withdraw, when the user is unknown', async () => {
    await expectError(call(withdraw, { amount: 100, message: 'Hello', uid: players.player.uid }, 'unknown-uid'), 'not-found');
  });

  it('should deny a withdraw, when the user is not a bank admin', async () => {
    await expectError(call(withdraw, { amount: 100, message: 'Hello', uid: players.player.uid }, players.player.uid), 'permission-denied');
  });

  it('should deny a withdraw, when the player is unknown', async () => {
    await expectError(call(withdraw, { amount: 100, message: 'Hello', uid: 'unknown-uid' }, players.bankAdmin.uid), 'not-found');
  });

  it('should deny a withdraw, when the amount is missing or zero', async () => {
    await expectError(call(withdraw, { amount: 0, message: 'Hello', uid: players.player.uid }, players.bankAdmin.uid), 'failed-precondition');
  });

  it('should deny a withdraw, when the amount is negative', async () => {
    await expectError(call(withdraw, { amount: -100, message: 'Hello', uid: players.player.uid }, players.bankAdmin.uid), 'failed-precondition');
  });

  it('should deny a withdraw, when the player does not have enough money', async () => {
    await expectError(call(withdraw, { amount: 201, message: 'Hello', uid: players.player.uid }, players.bankAdmin.uid), 'failed-precondition');
  });

  it('should withdraw the amount from the player', async () => {
    expect(await call(withdraw, { amount: 200, message: 'Hello', uid: players.player.uid }, players.bankAdmin.uid)).toBe(true);
    expect(await readTransactions()).toEqual([{ amount: 200, message: 'Hello', from: players.player.uid, to: null, involved: [players.player.uid] }]);
  });
});
