import { Bid, Player } from '@f2020/data';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aiGeneratedRoast, escapeHtml, resultMail, roastSections, standingsTable } from './result-mail';

const create = vi.fn();

vi.mock('./openai.service', () => ({
  OpenAIModel: 'test-model',
  openai: () => ({ chat: { completions: { create } } }),
}));

vi.mock('firebase-functions/logger', () => ({ warn: vi.fn() }));

const player = (uid: string): Player => ({ uid, displayName: `Player ${uid}`, email: `${uid}@example.com` }) as Player;

const bid = (uid: string, points: number): Partial<Bid> => ({ player: player(uid), points });

describe('escapeHtml', () => {
  it('escapes the characters that would break the html', () => {
    expect(escapeHtml(`<b>"Tom" & 'Jerry'</b>`)).toBe('&#60;b&#62;&#34;Tom&#34; &#38; &#39;Jerry&#39;&#60;/b&#62;');
  });

  it('returns an empty string without text', () => {
    expect(escapeHtml()).toBe('');
  });
});

describe('standingsTable', () => {
  it('lets players with the same points share the position, and only shows it once', () => {
    const table = standingsTable(player('a'), [bid('a', 10), bid('b', 8), bid('c', 8), bid('d', 3)]);
    const positions = [...table.matchAll(/text-align:right">(\d*)\.?<\/td>/g)].map(m => m[1]);
    expect(positions).toEqual(['1', '2', '', '4']);
  });

  it('highlights the player reading it', () => {
    const table = standingsTable(player('b'), [bid('a', 10), bid('b', 8)]);
    const rows = table.split('<tr');
    expect(rows[1]).not.toContain('background:#fce4ec');
    expect(rows[2]).toContain('background:#fce4ec');
  });

  it('adds the extra column', () => {
    expect(standingsTable(player('a'), [bid('a', 10)], () => '25 WBC')).toContain('25 WBC');
  });
});

describe('roastSections', () => {
  it('is empty without a roast', () => {
    expect(roastSections(undefined, 'Best', 'Worst')).toBe('');
  });

  it('escapes the text from OpenAI', () => {
    expect(roastSections({ best: '<script>', worst: 'ok' }, 'Best', 'Worst')).toContain('&#60;script&#62;');
  });
});

describe('resultMail', () => {
  it('greets the player and ends like every other mail', () => {
    const mail = resultMail(player('a'), 'Intro', 'Content', 'https://example.com');
    expect(mail).toContain('Hej Player a');
    expect(mail).toContain('<a href="https://example.com">Se løbet</a>');
    expect(mail).toMatch(/Wroouumm,<br\/>F1emming<\/p>\s*<\/div>$/);
  });
});

describe('aiGeneratedRoast', () => {
  beforeEach(() => {
    create.mockReset();
  });

  it('is not generated when every player has the same points', async () => {
    expect(await aiGeneratedRoast('test', [bid('a', 5), bid('b', 5)], () => '')).toBeUndefined();
    expect(create).not.toHaveBeenCalled();
  });

  it('describes the best and the worst players, including those with the same points', async () => {
    create.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ best: 'Godt', worst: 'Skidt' }) } }] });
    const describe = vi.fn((bids: Partial<Bid>[]) => bids.map(b => b.player?.uid).join(','));

    const roast = await aiGeneratedRoast('test', [bid('a', 10), bid('b', 10), bid('c', 5), bid('d', 1), bid('e', 1)], describe);

    expect(roast).toEqual({ best: 'Godt', worst: 'Skidt' });
    expect(create.mock.calls[0][0].messages[1].content).toBe('Bedst:\na,b\n\nDårligst:\nd,e');
  });

  it('tells OpenAI not to spoil the qualifying or the race', async () => {
    create.mockResolvedValue({ choices: [{ message: { content: '{"best":"","worst":""}' } }] });
    await aiGeneratedRoast('test', [bid('a', 10), bid('b', 5)], () => '');
    expect(create.mock.calls[0][0].messages[0].content).toContain('Nævn aldrig kørere');
  });

  it('is left out when OpenAI fails', async () => {
    create.mockRejectedValue(new Error('Down'));
    expect(await aiGeneratedRoast('test', [bid('a', 10), bid('b', 5)], () => '')).toBeUndefined();
  });
});
