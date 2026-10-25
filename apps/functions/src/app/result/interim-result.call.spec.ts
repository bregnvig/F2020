import { Bid } from '@f2020/data';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { call, expectError } from '../../test/functions';
import { bids, clone, drivers, players, readBid, readMails, readRace, results, team, writeBid, writePlayers, writeRace, writeSeason, writeTeam } from '../../test/fixtures';
import { submitInterimResult } from './interim-result.call';

const create = vi.fn();

vi.mock('../../lib/openai.service', () => ({
  OpenAIModel: 'test-model',
  openai: () => ({ chat: { completions: { create } } }),
}));

const interimResult: Partial<Bid> = {
  qualify: results[0].qualify,
  selectedDriver: { grid: 5 },
  selectedTeam: { qualify: 'ant' },
  polePositionTime: 80_000,
};

const submit = (result: Partial<Bid>) => call(submitInterimResult, result as Bid, players.admin.uid);

const invalid = (change: (result: Partial<Bid>) => void) => {
  const result = clone(interimResult);
  change(result);
  return result;
};

describe('submit interim result', () => {
  beforeEach(async () => {
    create.mockReset().mockRejectedValue(new Error('No OpenAI in the tests'));
    await writePlayers('admin', 'player', 'player1', 'bookie');
    await writeSeason();
    await writeTeam();
    await writeRace(1, { state: 'closed', selectedTeam: team });
    await writeBid(1, { ...bids.admin, submitted: true, selectedTeam: { qualify: 'ant', result: 'ant' } });
    await writeBid(1, { ...bids.player, submitted: true, selectedTeam: { qualify: 'rus', result: 'ant' } });
  });

  it('should deny an interim result, when no one is logged in', async () => {
    await expectError(call(submitInterimResult, interimResult as Bid), 'unauthenticated');
  });

  it('should deny an interim result, when the user is unknown', async () => {
    await expectError(call(submitInterimResult, interimResult as Bid, 'unknown-uid'), 'not-found');
  });

  it('should deny an interim result, when the user is not an admin', async () => {
    await expectError(call(submitInterimResult, interimResult as Bid, players.player.uid), 'permission-denied');
  });

  it.each(['open', 'completed', 'waiting'])('should deny an interim result, when the race is %s', async state => {
    await writeRace(1, { state, selectedTeam: team });
    await expectError(submit(interimResult), 'not-found');
  });

  it.each([
    ['no result', () => undefined as unknown as Partial<Bid>],
    ['the same driver twice in qualify', () => invalid(result => (result.qualify![1] = result.qualify![0]))],
    ['eight drivers in qualify', () => invalid(result => result.qualify!.push('alo'))],
    ['six drivers in qualify', () => invalid(result => (result.qualify!.length = 6))],
    ['the selected driver starting as 0', () => invalid(result => (result.selectedDriver!.grid = 0))],
    ['the selected driver starting after the last', () => invalid(result => (result.selectedDriver!.grid = drivers.length + 1))],
    ['no team', () => invalid(result => (result.selectedTeam = {} as Bid['selectedTeam']))],
    ['an empty team', () => invalid(result => (result.selectedTeam = { qualify: '' }))],
    ['a driver from another team', () => invalid(result => (result.selectedTeam = { qualify: 'ham' }))],
  ])('should deny an interim result with %s', async (_, result) => {
    await expectError(submit(result()), 'failed-precondition');
  });

  it('should give the points of the qualifying, the selected driver and the team', async () => {
    expect(await submit(interimResult)).toBe(true);
    expect((await readBid(1, players.admin.uid)).points).toBe(12 + 3 + 1);
    expect((await readBid(1, players.player.uid)).points).toBe(5 + 1 + 0);
    expect((await readRace(1)).result).toEqual(interimResult);
  });

  it('should only give points to submitted bids', async () => {
    await writeBid(1, { ...bids.player1, selectedTeam: { qualify: 'rus', result: 'rus' } });
    expect(await submit(interimResult)).toBe(true);
    expect((await readBid(1, players.player1.uid)).points).toBeUndefined();
  });

  it('should mail every player who played, also when OpenAI fails', async () => {
    expect(await submit(interimResult)).toBe(true);
    const mails = await readMails();
    expect(mails.map(mail => mail.to).sort()).toEqual([[players.admin.email], [players.player.email]]);
    expect(mails.every(mail => mail.message.subject === 'Så er der mellemresultat for Azerbaijan Grand Prix')).toBe(true);
  });

  it('should not tell OpenAI the drivers, so the roast cannot spoil the qualifying', async () => {
    create.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ best: 'Godt', worst: 'Skidt' }) } }] });
    expect(await submit(interimResult)).toBe(true);
    const prompt: string = create.mock.calls[0][0].messages[1].content;
    expect(prompt).toContain(players.admin.displayName);
    drivers.forEach(driver => expect(prompt).not.toMatch(new RegExp(`\\b${driver}\\b`, 'i')));
    expect((await readMails())[0].message.html).toContain('Godt');
  });
});
