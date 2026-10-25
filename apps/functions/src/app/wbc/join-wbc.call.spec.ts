import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it } from 'vitest';
import { call, expectError } from '../../test/functions';
import { players, readSeason, readTransactions, updatePlayer, writePlayers, writeSeason } from '../../test/fixtures';
import { joinWBC } from './join-wbc.call';

describe('join WBC', () => {
  beforeEach(async () => {
    await writePlayers('player', 'admin', 'bookie');
    await writeSeason();
  });

  it('should deny joining, when no one is logged in', async () => {
    await expectError(call(joinWBC), 'unauthenticated');
  });

  it('should deny joining, when the user is unknown', async () => {
    await expectError(call(joinWBC, undefined, 'unknown-uid'), 'not-found');
  });

  it('should deny joining, when the player has already joined', async () => {
    await writeSeason({ wbc: { latestWBCJoinDate: DateTime.local().plus({ days: 1 }).toJSDate(), participants: [players.player.uid] } });
    await expectError(call(joinWBC, undefined, players.player.uid), 'failed-precondition');
  });

  it('should deny joining, when the player does not have enough money', async () => {
    await updatePlayer(players.player.uid, { balance: -1 });
    await expectError(call(joinWBC, undefined, players.player.uid), 'failed-precondition');
  });

  it('should deny joining, when it is too late', async () => {
    await writeSeason({ wbc: { latestWBCJoinDate: DateTime.local().minus({ days: 1 }).toJSDate() } });
    await expectError(call(joinWBC, undefined, players.player.uid), 'failed-precondition');
  });

  it('should add the player to the WBC, and pay the bookie', async () => {
    expect(await call(joinWBC, undefined, players.player.uid)).toBe(true);
    expect((await readSeason()).wbc.participants).toEqual([players.player.uid]);
    expect(await readTransactions()).toEqual([
      { amount: 100, message: 'Deltagelse WBC', from: players.player.uid, to: players.bookie.uid, involved: [players.player.uid, players.bookie.uid] },
    ]);
  });
});
