import { Player } from '@f2020/data';
import { beforeEach, describe, expect, it } from 'vitest';
import { call, expectError } from '../../test/functions';
import { bids, players, updatePlayer, writeBid, writePlayers, writeRace, writeSeason } from '../../test/fixtures';
import { withoutBid } from './without-bid.call';

const uids = (players: Player[]) => players.map(p => p.uid).sort();

describe('players without a bid', () => {
  beforeEach(async () => {
    await writePlayers('admin', 'player', 'player1', 'bookie');
    await writeSeason();
    await writeRace(1, { state: 'open' });
    await writeBid(1, { ...bids.admin, submitted: true });
    await writeBid(1, bids.player);
  });

  it('should deny the list, when the user is not an admin', async () => {
    await expectError(call(withoutBid, undefined, players.player.uid), 'permission-denied');
  });

  it('should list the players who have not submitted a bid', async () => {
    expect(uids(await call(withoutBid, undefined, players.admin.uid))).toEqual([players.player.uid, players.player1.uid]);
  });

  it('should leave out the players who do not want reminders', async () => {
    await updatePlayer(players.player1.uid, { receiveReminders: false });
    expect(uids(await call(withoutBid, undefined, players.admin.uid))).toEqual([players.player.uid]);
  });
});
