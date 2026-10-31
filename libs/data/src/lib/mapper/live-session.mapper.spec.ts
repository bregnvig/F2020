import { Interval, Lap, Position, Stint } from '@f2020/openf1';
import { describe, expect, it } from 'vitest';
import { IDriver } from '../model';
import { map } from './live-session.mapper';

const driver = (driverId: string, number: number) => ({ driverId, name: driverId, code: driverId.toUpperCase(), permanentNumbers: [number] }) as IDriver;
const drivers = [driver('rus', 63), driver('lec', 16), driver('ham', 44)];

const position = (driver_number: number, place: number) => ({ driver_number, position: place }) as Position;
const lap = (driver_number: number, lap_number: number, lap_duration: number | null) => ({ driver_number, lap_number, lap_duration }) as Lap;
const stint = (driver_number: number, stint_number: number, compound: string, lap_start: number, tyre_age_at_start = 0) =>
  ({ driver_number, stint_number, compound, lap_start, tyre_age_at_start }) as Stint;

describe('live session mapper', () => {
  const laps = [lap(63, 1, null), lap(63, 2, 91.5), lap(63, 3, 90.2), lap(63, 4, null), lap(16, 1, 90.9), lap(16, 2, 90.1), lap(44, 1, null)];

  it('should order a practice by the best lap, with the gap to the best lap', () => {
    const results = map({ positions: [position(63, 1), position(16, 2), position(44, 3)], laps, intervals: [], stints: [], drivers, byPosition: false });
    expect(results.map(r => [r.driver.driverId, r.position, r.bestLap, r.lastLap, r.gap, r.fastest, r.lap])).toEqual([
      ['lec', 1, 90_100, 90_100, undefined, true, 2],
      ['rus', 2, 90_200, 90_200, 100, false, 4],
      ['ham', 3, undefined, undefined, undefined, false, 1],
    ]);
  });

  it('should order the sprint by position, with the gap to the leader', () => {
    const intervals = [
      { driver_number: 16, gap_to_leader: 0 },
      { driver_number: 63, gap_to_leader: 1.234 },
      { driver_number: 44, gap_to_leader: '+1 LAP' },
    ] as unknown as Interval[];
    const results = map({ positions: [position(63, 2), position(16, 1), position(44, 3)], laps, intervals, stints: [], drivers, byPosition: true });
    expect(results.map(r => [r.driver.driverId, r.position, r.gap, r.lapsBehind])).toEqual([
      ['lec', 1, 0, undefined],
      ['rus', 2, 1234, undefined],
      ['ham', 3, undefined, '+1 LAP'],
    ]);
  });

  it('should have the tyre of the latest stint, and the laps driven on it', () => {
    const stints = [stint(63, 1, 'MEDIUM', 1), stint(63, 2, 'SOFT', 3, 2)];
    const [rus] = map({ positions: [position(63, 1)], laps, intervals: [], stints, drivers, byPosition: false });
    expect([rus.tyre, rus.tyreAge]).toEqual(['SOFT', 3]);
  });
});
