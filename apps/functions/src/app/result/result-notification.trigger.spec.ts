import { Bid } from '@f2020/data';
import { describe, expect, it } from 'vitest';
import { personalSituation } from './result-notification.trigger';

const bid = (name: string, points: number) => ({ player: { uid: name.toLowerCase(), displayName: name }, points }) as Bid;

const bids = [bid('Anna', 40), bid('Bo', 30), bid('Carl', 25), bid('Dorte', 20), bid('Erik', 20), bid('Frida', 10)];

describe('personalSituation', () => {
  it('should tell about the player in front and behind', () => {
    expect(personalSituation(bids, 'dorte', 12)).toEqual({
      last: false,
      content: 'Dorte kom på 4. pladsen med 20 point og fik 12 WBC point.\nLige foran: Carl med 25 point.\nLige bagved: Erik med 20 point.',
    });
  });

  it('should give players with the same points the same place', () => {
    expect(personalSituation(bids, 'erik', 12)?.content).toContain('Erik kom på 4. pladsen');
  });

  it('should tell the last that no one is behind', () => {
    expect(personalSituation(bids, 'frida', 0)).toEqual({
      last: true,
      content: 'Frida kom på 6. pladsen med 10 point og fik 0 WBC point.\nLige foran: Erik med 20 point.',
    });
  });

  it('should make every player with the fewest points last', () => {
    const tied = [...bids.slice(0, 5), bid('Frida', 20)];
    expect(personalSituation(tied, 'dorte', 0)?.last).toBe(true);
  });

  it('should tell nothing about a player without a bid', () => {
    expect(personalSituation(bids, 'unknown', 0)).toBeUndefined();
  });
});
