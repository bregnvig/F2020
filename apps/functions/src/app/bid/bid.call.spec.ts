import { Bid } from '@f2020/data';
import { beforeEach, describe, expect, it } from 'vitest';
import { call, expectError } from '../../test/functions';
import { bids, clone, drivers, players, readBid, readTransactions, team, updatePlayer, writePlayers, writeRace, writeSeason, writeTeam } from '../../test/fixtures';
import { submitBid } from './bid.call';

const submit = (bid: Bid) => call(submitBid, bid, players.player.uid);

/** The player's bid, changed by the function */
const invalid = (change: (bid: Bid) => void) => {
  const bid = clone(bids.player);
  change(bid);
  return bid;
};

describe('submit bid', () => {
  beforeEach(async () => {
    await writePlayers('player', 'admin', 'bookie');
    await writeSeason();
    await writeTeam();
    await writeRace(1, { state: 'open' });
  });

  it('should deny a bid, when no one is logged in', async () => {
    await expectError(call(submitBid, bids.player), 'unauthenticated');
  });

  it('should deny a bid, when the user is unknown', async () => {
    await expectError(call(submitBid, bids.player, 'unknown-uid'), 'not-found');
  });

  it('should deny a bid, when the user is not a player', async () => {
    await expectError(call(submitBid, bids.player, players.bookie.uid), 'permission-denied');
  });

  it('should deny a bid, when there is no bid', async () => {
    await expectError(call(submitBid, undefined, players.player.uid), 'not-found');
  });

  it('should deny a bid, when it is for another player', async () => {
    await expectError(call(submitBid, bids.admin, players.player.uid), 'permission-denied');
  });

  it('should deny a bid, when there is no open race', async () => {
    await writeRace(1, { state: 'closed' });
    await expectError(submit(bids.player), 'failed-precondition');
  });

  it.each([
    ['the same driver twice in qualify', (bid: Bid) => (bid.qualify[1] = bid.qualify[0])],
    ['seven drivers in qualify', (bid: Bid) => bid.qualify.push('alo')],
    ['five drivers in qualify', (bid: Bid) => ((bid.qualify as string[]).length = 5)],
    ['the same driver twice in the podium', (bid: Bid) => (bid.podium[1] = bid.podium[0])],
    ['four drivers in the podium', (bid: Bid) => bid.podium.push('alo')],
    ['two drivers in the podium', (bid: Bid) => ((bid.podium as string[]).length = 2)],
    ['two fastest drivers', (bid: Bid) => bid.fastestDriver.push('alo')],
    ['no fastest driver', (bid: Bid) => ((bid.fastestDriver as string[]).length = 0)],
    ['two first crashes', (bid: Bid) => bid.firstCrash.push('alo')],
    ['no first crash', (bid: Bid) => (bid.firstCrash.length = 0)],
    ['no slowest pit stop', (bid: Bid) => ((bid.slowestPitStop as string[]).length = 0)],
    ['the selected driver starting as 0', (bid: Bid) => (bid.selectedDriver.grid = 0)],
    ['the selected driver starting after the last', (bid: Bid) => (bid.selectedDriver.grid = drivers.length + 1)],
    ['the selected driver finishing as 0', (bid: Bid) => (bid.selectedDriver.finish = 0)],
    ['the selected driver finishing after the last', (bid: Bid) => (bid.selectedDriver.finish = drivers.length + 1)],
    ['the selected driver finishing as -1', (bid: Bid) => (bid.selectedDriver.finish = -1)],
    ['a negative pole position time', (bid: Bid) => (bid.polePositionTime = -1)],
    ['a pole position time of 2 minutes', (bid: Bid) => (bid.polePositionTime = 1000 * 60 * 2)],
    ['a pole position time of 50 seconds', (bid: Bid) => (bid.polePositionTime = 1000 * 50)],
  ])('should deny a bid with %s', async (_, change) => {
    await expectError(submit(invalid(change)), 'failed-precondition');
  });

  describe('with a selected team', () => {
    beforeEach(() => writeRace(1, { state: 'open', selectedTeam: team }));

    it.each([
      ['no team', (bid: Bid) => delete bid.selectedTeam],
      ['an empty team', (bid: Bid) => (bid.selectedTeam = { qualify: '', result: '' })],
      ['a driver from another team', (bid: Bid) => (bid.selectedTeam = { qualify: 'rus', result: 'ham' })],
    ])('should deny a bid with %s', async (_, change) => {
      await expectError(submit(invalid(change)), 'failed-precondition');
    });

    it('should accept a bid with a driver of the team', async () => {
      expect(await submit({ ...bids.player, selectedTeam: { qualify: 'rus', result: 'ant' } })).toBe(true);
      expect((await readBid(1, players.player.uid)).selectedTeam).toEqual({ qualify: 'rus', result: 'ant' });
    });
  });

  it('should deny a bid, when the player owes more than 100', async () => {
    await updatePlayer(players.player.uid, { balance: -81 });
    await expectError(submit(bids.player), 'failed-precondition');
  });

  it('should accept a bid, when the player owes 100 after paying', async () => {
    await updatePlayer(players.player.uid, { balance: -80 });
    expect(await submit(bids.player)).toBe(true);
  });

  it('should store the bid as submitted, and pay the bookie', async () => {
    expect(await submit(bids.player)).toBe(true);
    expect(await readBid(1, players.player.uid)).toEqual({ ...bids.player, submitted: true });
    expect(await readTransactions()).toEqual([
      {
        amount: 20,
        message: 'Deltagelse i Azerbaijan Grand Prix',
        from: players.player.uid,
        to: players.bookie.uid,
        involved: [players.player.uid, players.bookie.uid],
      },
    ]);
  });
});
