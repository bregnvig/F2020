import { Driver, SessionResult } from '@f2020/openf1';
import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import { IRaceSession } from '../model';
import { map } from './session-result.mapper';

const session: IRaceSession = { type: 'qualifying', start: DateTime.fromISO('2026-10-31T22:00:00Z'), end: DateTime.fromISO('2026-10-31T23:00:00Z') };

const openF1Driver = (name_acronym: string, driver_number: number) =>
  ({ name_acronym, driver_number, full_name: `${name_acronym} DRIVER`, team_name: 'Mercedes', country_code: 'GBR' }) as Driver;

const drivers = [openF1Driver('RUS', 63), openF1Driver('ANT', 12), openF1Driver('LEC', 16)];

const result = (driver_number: number, position: number | null, values: Partial<SessionResult> = {}) =>
  ({ driver_number, position, number_of_laps: 20, dnf: false, dns: false, dsq: false, ...values }) as SessionResult;

describe('session result mapper', () => {
  it('should use the last part of a qualifying', () => {
    const { results } = map({
      session,
      drivers,
      sessionResults: [
        result(63, 1, { duration: [80.1, 79.5, 79.123], gap_to_leader: [0, 0, 0] }),
        result(12, 2, { duration: [80.2, 79.6, 79.2], gap_to_leader: [0.1, 0.1, 0.077] }),
        result(16, 3, { duration: [81, null, null], gap_to_leader: [0.9, null, null] } as unknown as SessionResult),
      ],
    });
    expect(results.map(r => [r.driver.driverId, r.position, r.duration, r.gapToLeader])).toEqual([
      ['rus', 1, 79_123, undefined],
      ['ant', 2, 79_200, 77],
      ['lec', 3, 81_000, 900],
    ]);
  });

  it('should keep the laps behind and put the drivers without a position last', () => {
    const { results } = map({
      session: { ...session, type: 'race' },
      drivers,
      sessionResults: [result(16, null, { dnf: true, number_of_laps: 3 }), result(63, 1, { duration: 5400.5, gap_to_leader: 0 }), result(12, 2, { gap_to_leader: '+1 LAP' })],
    });
    expect(results.map(r => [r.driver.driverId, r.position, r.gapToLeader, r.status])).toEqual([
      ['rus', 1, 0, undefined],
      ['ant', 2, '+1 LAP', undefined],
      ['lec', undefined, undefined, 'dnf'],
    ]);
  });

  it('should skip a result without a driver', () => {
    expect(map({ session, drivers, sessionResults: [result(99, 1)] }).results).toEqual([]);
  });
});
