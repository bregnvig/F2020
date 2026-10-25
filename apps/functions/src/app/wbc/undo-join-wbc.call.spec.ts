import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it } from 'vitest';
import { call, expectError } from '../../test/functions';
import { players, readSeason, readTransactions, writePlayers, writeSeason } from '../../test/fixtures';
import { undoWBC } from './undo-join-wbc.call';

const wbc = (wbc: { participants?: string[]; latestWBCJoinDate?: Date }) => ({
  wbc: { latestWBCJoinDate: DateTime.local().plus({ days: 1 }).toJSDate(), participants: [players.player.uid], ...wbc },
});

describe('undo joining WBC', () => {
  beforeEach(async () => {
    await writePlayers('player', 'admin', 'bookie');
    await writeSeason(wbc({}));
  });

  it('should deny undoing, when no one is logged in', async () => {
    await expectError(call(undoWBC), 'unauthenticated');
  });

  it('should deny undoing, when the user is unknown', async () => {
    await expectError(call(undoWBC, undefined, 'unknown-uid'), 'not-found');
  });

  it('should deny undoing, when the player never joined', async () => {
    await expectError(call(undoWBC, undefined, players.admin.uid), 'failed-precondition');
  });

  it('should deny undoing, when it is too late', async () => {
    await writeSeason(wbc({ latestWBCJoinDate: DateTime.local().minus({ days: 1 }).toJSDate() }));
    await expectError(call(undoWBC, undefined, players.player.uid), 'failed-precondition');
  });

  it('should remove the player from the WBC, and pay the player back', async () => {
    expect(await call(undoWBC, undefined, players.player.uid)).toBe(true);
    expect((await readSeason()).wbc.participants).toEqual([]);
    expect(await readTransactions()).toEqual([
      { amount: 100, message: 'Fortrød deltagelse i WBC', from: players.bookie.uid, to: players.player.uid, involved: [players.bookie.uid, players.player.uid] },
    ]);
  });
});
