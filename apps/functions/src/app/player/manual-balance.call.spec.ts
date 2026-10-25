import { beforeEach, describe, expect, it } from 'vitest';
import { call, expectError } from '../../test/functions';
import { players, readPlayer, writePlayers } from '../../test/fixtures';
import { manualBalance } from './manual-balance.call';

describe('manual balance', () => {
  beforeEach(() => writePlayers('player', 'admin', 'bankAdmin'));

  it('should deny a manual balance, when no one is logged in', async () => {
    await expectError(call(manualBalance, { uid: players.player.uid, balance: 111 }), 'unauthenticated');
  });

  it('should deny a manual balance, when the user is not a bank admin', async () => {
    await expectError(call(manualBalance, { uid: players.player.uid, balance: 111 }, players.admin.uid), 'permission-denied');
  });

  it('should set the balance, when the user is a bank admin', async () => {
    expect(await call(manualBalance, { uid: players.player.uid, balance: 111 }, players.bankAdmin.uid)).toBe(true);
    expect((await readPlayer(players.player.uid)).balance).toBe(111);
  });
});
