import { IRace, IRaceSession, Player } from '@f2020/data';
import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import { sessionReminders } from './session-reminder.crontab';

const now = DateTime.fromISO('2026-10-31T18:25:02', { zone: 'Europe/Copenhagen' });

const session = (type: IRaceSession['type'], start: DateTime, number?: number): IRaceSession => ({ type, number, start, end: start.plus({ hours: 1 }) });

const race = (...schedule: IRaceSession[]) => ({ season: 2026, round: 20, name: 'Mexico City Grand Prix', schedule }) as unknown as IRace;

const player = (uid: string, sessionReminders?: IRaceSession['type'][], tokens = [`${uid}-token`]) => ({ uid, sessionReminders, tokens }) as Player;

describe('sessionReminders', () => {
  it('should remind of a session starting within the next 5 minutes', () => {
    const reminders = sessionReminders(race(session('practice', now.set({ minute: 30, second: 0 }), 3)), [player('anna', ['practice'])], now);
    expect(reminders).toEqual([
      { tokens: ['anna-token'], title: '3. træning starter kl. 18:30', body: 'Mexico City Grand Prix', link: expect.stringMatching(/\/2026\/race\/20\/session\/practice-3$/) },
    ]);
  });

  it('should not remind of a session that has started, or starts in more than 5 minutes', () => {
    const started = session('practice', now.set({ minute: 0, second: 0 }), 3);
    const inHalfAnHour = session('sprint', now.set({ hour: 19, minute: 0, second: 0 }));
    const later = session('qualifying', now.set({ hour: 22, minute: 0, second: 0 }));
    expect(sessionReminders(race(started, inHalfAnHour, later), [player('anna', ['practice', 'sprint', 'qualifying'])], now)).toEqual([]);
  });

  it('should only remind the players who want a reminder of that kind of session', () => {
    const qualifying = session('qualifying', now.set({ minute: 30, second: 0 }));
    const players = [player('anna', ['qualifying', 'race']), player('bo', ['race']), player('carl'), player('dorte', ['qualifying'], [])];
    expect(sessionReminders(race(qualifying), players, now).map(r => r.tokens)).toEqual([['anna-token']]);
  });

  it('should link the race and the qualifying to their live pages', () => {
    const start = now.set({ minute: 30, second: 0 });
    const players = [player('anna', ['qualifying', 'race'])];
    expect(sessionReminders(race(session('race', start)), players, now)[0].link).toMatch(/\/2026\/race\/20\/live$/);
    expect(sessionReminders(race(session('qualifying', start)), players, now)[0].link).toMatch(/\/2026\/race\/20\/live\/qualify$/);
  });

  it('should tell the time in Denmark', () => {
    const start = DateTime.fromISO('2026-10-31T17:30:00Z');
    expect(sessionReminders(race(session('sprint', start)), [player('anna', ['sprint'])], now)[0].title).toBe('Sprint starter kl. 18:30');
  });
});
