import { Stint } from '@f2020/openf1';
import { describe, expect, it, vi } from 'vitest';
import { IDriver } from '../model';
import { map } from './stint.mapper';

const driver = (driverId: string, number: number) => ({ driverId, name: driverId, code: driverId.toUpperCase(), permanentNumbers: [number] }) as IDriver;
const stint = (driver_number: number, stint_number: number, compound: string, lap_start: number) =>
  ({ driver_number, stint_number, compound, lap_start, tyre_age_at_start: 0 }) as Stint;

describe('stint mapper', () => {
  it('should skip the stints of a driver who is not in the drivers', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const stints = map({ stints: [stint(63, 1, 'MEDIUM', 1), stint(51, 1, 'SOFT', 1), stint(63, 2, 'HARD', 20)], drivers: [driver('rus', 63)] });
    expect(stints.map(s => [s.driver.driverId, s.compound, s.stintNumber])).toEqual([['rus', 'HARD', 2]]);
  });
});
