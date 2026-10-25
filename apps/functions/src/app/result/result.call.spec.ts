import { Bid } from '@f2020/data';
import { beforeEach, describe, expect, it } from 'vitest';
import { call, expectError } from '../../test/functions';
import { bids, clone, drivers, players, readBid, readRace, readTransactions, results, team, writeBid, writePlayers, writeRace, writeSeason, writeTeam } from '../../test/fixtures';
import { submitResult } from './result.call';

const submit = (result: Bid, round = 1) => call(submitResult, { round, result }, players.admin.uid);

const invalid = (change: (result: Bid) => void) => {
  const result = clone(results[0]);
  change(result);
  return result;
};

const winnings = (uid: string, amount: number) => ({
  amount,
  message: 'Gevinst Azerbaijan Grand Prix',
  from: players.bookie.uid,
  to: uid,
  involved: [players.bookie.uid, uid],
});

describe('submit result', () => {
  beforeEach(async () => {
    await writePlayers('admin', 'player', 'player1', 'bookie');
    await writeSeason();
    await writeTeam();
    await writeRace(1, { state: 'closed' });
  });

  it('should deny a result, when no one is logged in', async () => {
    await expectError(call(submitResult, { round: 1, result: results[0] }), 'unauthenticated');
  });

  it('should deny a result, when the user is unknown', async () => {
    await expectError(call(submitResult, { round: 1, result: results[0] }, 'unknown-uid'), 'not-found');
  });

  it('should deny a result, when the user is not an admin', async () => {
    await expectError(call(submitResult, { round: 1, result: results[0] }, players.player.uid), 'permission-denied');
  });

  it('should deny a result, when the race is unknown', async () => {
    await expectError(submit(results[0], 99), 'not-found');
  });

  it.each(['open', 'completed', 'waiting'])('should deny a result, when the race is %s', async state => {
    await writeRace(1, { state });
    await expectError(submit(results[0]), 'failed-precondition');
  });

  it.each([
    ['no result', () => undefined as unknown as Bid],
    ['the same driver twice in qualify', () => invalid(result => (result.qualify[1] = result.qualify[0]))],
    ['eight drivers in qualify', () => invalid(result => result.qualify.push('alo'))],
    ['six drivers in qualify', () => invalid(result => (result.qualify.length = 6))],
    ['the same driver twice in the podium', () => invalid(result => (result.podium[1] = result.podium[0]))],
    ['five drivers in the podium', () => invalid(result => result.podium.push('alo'))],
    ['three drivers in the podium', () => invalid(result => (result.podium.length = 3))],
    ['the same fastest driver twice', () => invalid(result => (result.fastestDriver[1] = result.fastestDriver[0]))],
    ['one slowest pit stop', () => invalid(result => (result.slowestPitStop!.length = 1))],
    ['the selected driver starting as 0', () => invalid(result => (result.selectedDriver.grid = 0))],
    ['the selected driver starting after the last', () => invalid(result => (result.selectedDriver.grid = drivers.length + 1))],
    ['the selected driver finishing as 0', () => invalid(result => (result.selectedDriver.finish = 0))],
    ['the selected driver finishing after the last', () => invalid(result => (result.selectedDriver.finish = drivers.length + 1))],
    ['a negative pole position time', () => invalid(result => (result.polePositionTime = -1))],
    ['a pole position time of 2 minutes', () => invalid(result => (result.polePositionTime = 1000 * 60 * 2))],
    ['a pole position time of 50 seconds', () => invalid(result => (result.polePositionTime = 1000 * 50))],
  ])('should deny a result with %s', async (_, result) => {
    await expectError(submit(result()), 'failed-precondition');
  });

  describe('with a selected team', () => {
    beforeEach(() => writeRace(1, { state: 'closed', selectedTeam: team }));

    it.each([
      ['no team', (result: Bid) => delete result.selectedTeam],
      ['an empty team', (result: Bid) => (result.selectedTeam = { qualify: '', result: '' })],
      ['a driver from another team', (result: Bid) => (result.selectedTeam = { qualify: 'rus', result: 'ham' })],
    ])('should deny a result with %s', async (_, change) => {
      await expectError(submit(invalid(change)), 'failed-precondition');
    });

    it('should give a point for each team driver guessed', async () => {
      await writeBid(1, { ...bids.admin, submitted: true, selectedTeam: { qualify: 'ant', result: 'ant' } });
      await writeBid(1, { ...bids.player, submitted: true, selectedTeam: { qualify: 'rus', result: 'ant' } });
      expect(await submit({ ...results[0], selectedTeam: { qualify: 'ant', result: 'ant' } })).toBe(true);
      expect((await readBid(1, players.admin.uid)).points).toBe(31 + 2);
      expect((await readBid(1, players.player.uid)).points).toBe(14 + 1);
    });
  });

  it('should complete the race with the result, even when no bids were submitted', async () => {
    await writeBid(1, bids.admin);
    expect(await submit(results[0])).toBe(true);
    expect(await readRace(1)).toMatchObject({ state: 'completed', result: results[0] });
    expect(await readTransactions()).toEqual([]);
  });

  it('should give the points, and pay the winner what every bid paid', async () => {
    await writeBid(1, { ...bids.admin, submitted: true });
    await writeBid(1, { ...bids.player, submitted: true });
    await writeBid(1, { ...bids.player1, submitted: true });
    expect(await submit(results[0])).toBe(true);
    expect((await readBid(1, players.admin.uid)).points).toBe(31);
    expect((await readBid(1, players.player.uid)).points).toBe(14);
    expect((await readBid(1, players.player1.uid)).points).toBe(0);
    expect(await readTransactions()).toEqual([winnings(players.admin.uid, 60)]);
  });

  it('should pay the other player, when the other result wins', async () => {
    await writeBid(1, { ...bids.admin, submitted: true });
    await writeBid(1, { ...bids.player, submitted: true });
    expect(await submit(results[1])).toBe(true);
    expect((await readBid(1, players.admin.uid)).points).toBe(14);
    expect((await readBid(1, players.player.uid)).points).toBe(31);
    expect(await readTransactions()).toEqual([winnings(players.player.uid, 40)]);
  });

  it('should share the winnings, when the winners have the same points', async () => {
    await writeBid(1, { ...bids.admin, submitted: true });
    await writeBid(1, { ...bids.admin, player: players.player, submitted: true });
    await writeBid(1, { ...bids.player1, submitted: true });
    expect(await submit(results[0])).toBe(true);
    expect(await readTransactions()).toEqual(expect.arrayContaining([winnings(players.admin.uid, 30), winnings(players.player.uid, 30)]));
  });

  it('should give no first crash points, when no one crashed', async () => {
    await writeBid(1, { ...bids.admin, submitted: true });
    await writeBid(1, { ...bids.player, submitted: true });
    expect(await submit({ ...results[0], firstCrash: [] })).toBe(true);
    expect((await readBid(1, players.admin.uid)).points).toBe(31 - 3);
  });

  it('should only give points to submitted bids', async () => {
    await writeBid(1, bids.admin);
    await writeBid(1, { ...bids.player, submitted: true });
    expect(await submit(results[1])).toBe(true);
    expect((await readBid(1, players.player.uid)).points).toBe(31);
    expect((await readBid(1, players.admin.uid)).points).toBeUndefined();
  });
});
