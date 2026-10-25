import { calculateResult, WBCResult } from '@f2020/data';
import { beforeEach, describe, expect, it } from 'vitest';
import { updateAndTrigger } from '../../test/functions';
import { bids, players, races, readSeason, results, seasonId, writeBid, writePlayers, writeRace, writeSeason } from '../../test/fixtures';
import { documentPaths } from '../../lib';
import { wbcPointsTrigger } from './wbc-points.trigger';

const pattern = 'seasons/{seasonId}/races/{round}';

/** Writes the bids with their points, as the result does before it completes the race */
const writeCalculatedBids = (round: number, result: (typeof results)[number], ...bidList: (typeof bids.admin)[]) =>
  Promise.all(bidList.map(bid => writeBid(round, { ...calculateResult(bid, result), submitted: true })));

const complete = (round: number) => updateAndTrigger(wbcPointsTrigger, pattern, documentPaths.race(seasonId, round), { state: 'completed' });

const wbcResults = async (): Promise<WBCResult[]> => (await readSeason()).wbc.results ?? [];

const points = (result: WBCResult) => Object.fromEntries(result.players.map(p => [p.player.uid, p.points]));

describe('WBC points', () => {
  beforeEach(async () => {
    await writePlayers('admin', 'player', 'player1', 'bookie');
    await writeSeason();
    await writeRace(1, { state: 'closed' });
  });

  it('should add the race to the WBC of the season, and give the points in order', async () => {
    await writeCalculatedBids(1, results[1], bids.admin, bids.player);
    await complete(1);
    const [result] = await wbcResults();
    expect(result).toMatchObject({ raceName: races[0].name, round: 1, countryCode: 'AZ' });
    expect(result.players.map(p => p.player.uid)).toEqual([players.player.uid, players.admin.uid]);
    expect(points(result)).toEqual({ [players.player.uid]: 25, [players.admin.uid]: 18 });
  });

  it('should add the next race after the first', async () => {
    await writeCalculatedBids(1, results[1], bids.admin, bids.player);
    await complete(1);
    await writeRace(2, { state: 'closed' });
    await writeCalculatedBids(2, results[0], bids.admin, bids.player);
    await complete(2);
    const wbc = await wbcResults();
    expect(wbc.map(r => r.raceName)).toEqual([races[0].name, races[1].name]);
    expect(points(wbc[1])).toEqual({ [players.admin.uid]: 25, [players.player.uid]: 18 });
  });

  it('should replace the race, when it is completed again', async () => {
    await writeCalculatedBids(1, results[1], bids.admin, bids.player);
    await complete(1);
    await writeRace(1, { state: 'closed' });
    await writeCalculatedBids(1, results[0], bids.admin, bids.player);
    await complete(1);
    const wbc = await wbcResults();
    expect(wbc).toHaveLength(1);
    expect(points(wbc[0])).toEqual({ [players.admin.uid]: 25, [players.player.uid]: 18 });
  });

  it('should rank by the pole position time, when the points are equal', async () => {
    await writeCalculatedBids(1, results[0], bids.admin, { ...bids.admin, player: players.player, polePositionTime: 80_500 });
    await complete(1);
    const [result] = await wbcResults();
    expect(result.players.map(p => p.player.uid)).toEqual([players.admin.uid, players.player.uid]);
  });

  it('should leave out bids that were not submitted', async () => {
    await writeCalculatedBids(1, results[0], bids.admin, bids.player);
    await writeBid(1, bids.player1);
    await complete(1);
    const [result] = await wbcResults();
    expect(result.players).toHaveLength(2);
  });

  it('should include bids without points, but give them no WBC points', async () => {
    await writeCalculatedBids(1, results[0], bids.admin, bids.player, bids.player1);
    await complete(1);
    const [result] = await wbcResults();
    expect(points(result)).toEqual({ [players.admin.uid]: 25, [players.player.uid]: 18, [players.player1.uid]: 0 });
  });

  it('should do nothing, when the race is not completed from closed', async () => {
    await writeRace(1, { state: 'open' });
    await updateAndTrigger(wbcPointsTrigger, pattern, documentPaths.race(seasonId, 1), { state: 'closed' });
    expect(await wbcResults()).toEqual([]);
  });
});
