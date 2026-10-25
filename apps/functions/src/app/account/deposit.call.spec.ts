import { beforeEach, describe, expect, it } from 'vitest';
import { call, expectError } from '../../test/functions';
import { players, readTransactions, writePlayers } from '../../test/fixtures';
import { deposit } from './deposit.call';

describe('deposit', () => {
  beforeEach(() => writePlayers('player', 'bankAdmin'));

  it('should deny a deposit, when no one is logged in', async () => {
    await expectError(call(deposit, { amount: 100, message: 'Hello', uid: players.player.uid }), 'unauthenticated');
  });

  it('should deny a deposit, when the user is unknown', async () => {
    await expectError(call(deposit, { amount: 100, message: 'Hello', uid: players.player.uid }, 'unknown-uid'), 'not-found');
  });

  it('should deny a deposit, when the user is not a bank admin', async () => {
    await expectError(call(deposit, { amount: 100, message: 'Hello', uid: players.player.uid }, players.player.uid), 'permission-denied');
  });

  it('should deny a deposit, when the amount is missing or zero', async () => {
    await expectError(call(deposit, { amount: 0, message: 'Hello', uid: players.player.uid }, players.bankAdmin.uid), 'failed-precondition');
  });

  it('should deny a deposit, when the amount is negative', async () => {
    await expectError(call(deposit, { amount: -100, message: 'Hello', uid: players.player.uid }, players.bankAdmin.uid), 'failed-precondition');
  });

  it('should deny a deposit, when no player is given', async () => {
    await expectError(call(deposit, { amount: 100, message: 'Hello', uid: '' }, players.bankAdmin.uid), 'not-found');
  });

  it('should deposit the amount to the player', async () => {
    expect(await call(deposit, { amount: 100, message: 'Hello', uid: players.player.uid }, players.bankAdmin.uid)).toBe(true);
    expect(await readTransactions()).toEqual([{ amount: 100, message: 'Hello', from: null, to: players.player.uid, involved: [players.player.uid] }]);
  });
});
