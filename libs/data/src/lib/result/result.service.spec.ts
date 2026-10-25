import { describe, expect, it } from 'vitest';
import { Bid, SelectedDriverValue } from '../model';
import { calculateInterimResult, calculateResult, compareBids, offsetPoints, propertyPoints } from './result.service';

const result: Bid = {
  qualify: ['ver', 'had', 'nor', 'pia', 'lec', 'ham', 'rus'],
  podium: ['ver', 'had', 'nor', 'pia'],
  fastestDriver: ['ver', 'had'],
  firstCrash: ['str', 'gas'],
  slowestPitStop: ['mclaren', 'ferrari'],
  selectedDriver: { grid: 5, finish: 4 },
  selectedTeam: { qualify: 'ant', result: 'rus' },
  polePositionTime: 80_000,
};

/** Every guess is right */
const perfectBid: Bid = {
  qualify: ['ver', 'had', 'nor', 'pia', 'lec', 'ham'],
  podium: ['ver', 'had', 'nor'],
  fastestDriver: ['ver'],
  firstCrash: ['str'],
  slowestPitStop: ['mclaren'],
  selectedDriver: { grid: 5, finish: 4 },
  selectedTeam: { qualify: 'ant', result: 'rus' },
  polePositionTime: 80_100,
};

/** Every guess is one place off, or a driver who is not in the result */
const offBid: Bid = {
  qualify: ['had', 'ver', 'pia', 'nor', 'ham', 'alo'],
  podium: ['had', 'ver', 'pia'],
  fastestDriver: ['had'],
  firstCrash: ['gas'],
  slowestPitStop: ['ferrari'],
  selectedDriver: { grid: 7, finish: 1 },
  selectedTeam: { qualify: 'rus', result: 'ant' },
  polePositionTime: 81_112,
};

describe('Result service test', () => {
  it('should award points to qualify', () => {
    const result = ['grosjean', 'bottas', 'kevin_magnussen', 'albon', 'norris', 'russell', 'hamilton'];
    let bid = ['grosjean', 'bottas', 'kevin_magnussen', 'albon', 'norris', 'russell'];

    expect(offsetPoints(bid, result, 1)).toStrictEqual([2, 2, 2, 2, 2, 2]);

    bid = ['bottas', 'grosjean', 'kevin_magnussen', 'albon', 'norris', 'russell'];
    expect(offsetPoints(bid, result, 1)).toStrictEqual([1, 1, 2, 2, 2, 2]);

    bid = ['bottas', 'kevin_magnussen', 'grosjean', 'albon', 'norris', 'russell'];
    expect(offsetPoints(bid, result, 1)).toStrictEqual([1, 1, 0, 2, 2, 2]);

    bid = bid = ['russell', 'grosjean', 'bottas', 'kevin_magnussen', 'albon', 'norris'];
    expect(offsetPoints(bid, result, 1)).toStrictEqual([0, 1, 1, 1, 1, 1]);

    bid = bid = ['grosjean', 'bottas', 'kevin_magnussen', 'albon', 'norris', 'hamilton'];
    expect(offsetPoints(bid, result, 1)).toStrictEqual([2, 2, 2, 2, 2, 1]);

    bid = bid = ['kevin_magnussen', 'albon', 'norris', 'hamilton', 'grosjean', 'bottas'];
    expect(offsetPoints(bid, result, 1)).toStrictEqual([0, 0, 0, 0, 0, 0]);
  });

  it('should award points to podium', () => {
    const result = ['grosjean', 'bottas', 'kevin_magnussen', 'albon'];
    let bid = ['grosjean', 'bottas', 'kevin_magnussen'];

    expect(offsetPoints(bid, result, 1)).toStrictEqual([2, 2, 2]);

    bid = ['bottas', 'grosjean', 'kevin_magnussen'];
    expect(offsetPoints(bid, result, 1)).toStrictEqual([1, 1, 2]);

    bid = ['bottas', 'grosjean', 'albon'];
    expect(offsetPoints(bid, result, 1)).toStrictEqual([1, 1, 1]);
  });

  it('should award points to first crash', () => {
    let result = ['grosjean', 'bottas', 'kevin_magnussen'];
    const bid = ['grosjean'];

    expect(offsetPoints(bid, result, 2)).toStrictEqual([3]);

    result = ['bottas', 'kevin_magnussen', 'albon'];
    expect(offsetPoints(bid, result, 2)).toStrictEqual([0]);

    result = ['bottas', 'kevin_magnussen', 'grosjean'];
    expect(offsetPoints(bid, result, 2)).toStrictEqual([1]);

    result = ['kevin_magnussen', 'grosjean'];
    expect(offsetPoints(bid, result, 2)).toStrictEqual([2]);

    result = ['grosjean'];
    expect(offsetPoints(bid, result, 2)).toStrictEqual([3]);

    result = [];
    expect(offsetPoints(bid, result, 2)).toStrictEqual([0]);
  });

  it('should award points selected driver', () => {
    const result: SelectedDriverValue = { grid: 1, finish: 1 };
    let bid: SelectedDriverValue = { grid: 1, finish: 1 };

    expect(propertyPoints(bid, result)).toStrictEqual({ gridPoints: 3, finishPoints: 3 });

    bid = { grid: 2, finish: 1 };
    expect(propertyPoints(bid, result)).toStrictEqual({ gridPoints: 2, finishPoints: 3 });
    bid = { grid: 2, finish: 2 };
    expect(propertyPoints(bid, result)).toStrictEqual({ gridPoints: 2, finishPoints: 2 });
    bid = { grid: 3, finish: 2 };
    expect(propertyPoints(bid, result)).toStrictEqual({ gridPoints: 1, finishPoints: 2 });
    bid = { grid: 3, finish: 3 };
    expect(propertyPoints(bid, result)).toStrictEqual({ gridPoints: 1, finishPoints: 1 });
    bid = { grid: 4, finish: 3 };
    expect(propertyPoints(bid, result)).toStrictEqual({ gridPoints: 0, finishPoints: 1 });
    bid = { grid: 4, finish: 13 };
    expect(propertyPoints(bid, result)).toStrictEqual({ gridPoints: 0, finishPoints: 0 });
  });

  it('should give every point to a perfect bid', () => {
    const calculated = calculateResult(perfectBid, result);

    expect(calculated.qualifyPoints).toStrictEqual([2, 2, 2, 2, 2, 2]);
    expect(calculated.podiumPoints).toStrictEqual([2, 2, 2]);
    expect(calculated.fastestDriverPoints).toStrictEqual([2]);
    expect(calculated.firstCrashPoints).toStrictEqual([3]);
    expect(calculated.slowestPitStopPoints).toStrictEqual([2]);
    expect(calculated.selectedDriver).toStrictEqual({ grid: 5, finish: 4, gridPoints: 3, finishPoints: 3 });
    expect(calculated.selectedTeam).toStrictEqual({ qualify: 'ant', result: 'rus', qualifyPoints: 1, resultPoints: 1 });
    expect(calculated.polePositionTimeDiff).toBe(100);
    expect(calculated.points).toBe(12 + 6 + 2 + 3 + 2 + 6 + 2);
  });

  it('should give points for guesses that are one place off', () => {
    const calculated = calculateResult(offBid, result);

    expect(calculated.qualifyPoints).toStrictEqual([1, 1, 1, 1, 1, 0]);
    expect(calculated.podiumPoints).toStrictEqual([1, 1, 1]);
    expect(calculated.fastestDriverPoints).toStrictEqual([1]);
    expect(calculated.firstCrashPoints).toStrictEqual([2]);
    expect(calculated.slowestPitStopPoints).toStrictEqual([1]);
    expect(calculated.selectedDriver).toStrictEqual({ grid: 7, finish: 1, gridPoints: 1, finishPoints: 0 });
    expect(calculated.selectedTeam).toStrictEqual({ qualify: 'rus', result: 'ant', qualifyPoints: 0, resultPoints: 0 });
    expect(calculated.polePositionTimeDiff).toBe(1112);
    expect(calculated.points).toBe(5 + 3 + 1 + 2 + 1 + 1);
  });

  it('should calculate the result, when there is no fastest driver, first crash or slowest pit stop', () => {
    const calculated = calculateResult(perfectBid, { ...result, fastestDriver: [], firstCrash: [], slowestPitStop: undefined });

    expect(calculated.fastestDriverPoints).toStrictEqual([0]);
    expect(calculated.firstCrashPoints).toStrictEqual([0]);
    expect(calculated.slowestPitStopPoints).toStrictEqual([0]);
    expect(calculated.points).toBe(12 + 6 + 6 + 2);
  });

  it('should leave out the team, when the race has no selected team', () => {
    const calculated = calculateResult({ ...perfectBid, selectedTeam: undefined }, result);

    expect(calculated.selectedTeam).toBeUndefined();
    expect(calculated.points).toBe(12 + 6 + 2 + 3 + 2 + 6);
  });

  it('should only give the points of the qualifying in the interim result', () => {
    const interimResult: Partial<Bid> = { qualify: result.qualify, selectedDriver: { grid: 5 }, selectedTeam: { qualify: 'ant' }, polePositionTime: 80_000 };

    expect(calculateInterimResult(perfectBid, interimResult)).toMatchObject({ points: 12 + 3 + 1, polePositionTimeDiff: 100 });
    expect(calculateInterimResult(offBid, interimResult)).toMatchObject({ points: 5 + 1 + 0, polePositionTimeDiff: 1112 });
  });

  it('should leave out the pole position time in the interim result, when the qualifying has none', () => {
    const interimResult: Partial<Bid> = { qualify: result.qualify, selectedDriver: { grid: 5 }, selectedTeam: { qualify: 'ant' } };

    expect(calculateInterimResult(perfectBid, interimResult).polePositionTimeDiff).toBeUndefined();
  });

  it('should order the bids by points, and by the pole position time when the points are equal', () => {
    const bids: Partial<Bid>[] = [{ points: 10, polePositionTimeDiff: 500 }, { points: 20, polePositionTimeDiff: 900 }, { points: 10, polePositionTimeDiff: 100 }, { points: 10 }];

    expect([...bids].sort(compareBids)).toStrictEqual([bids[1], bids[2], bids[0], bids[3]]);
  });
});
