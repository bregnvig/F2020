import { IDriverSessionResult } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { documentPaths } from '../../lib/paths';
import { call, expectError } from '../../test/functions';
import { players, seasonId, writePlayers, writeRace } from '../../test/fixtures';
import { openF1Drivers } from '../../test/openf1';
import { sessionResultCall } from './session-result.call';

const openF1List = vi.fn();

vi.mock('../../lib/openf1.api', async importOriginal => ({
  ...(await importOriginal<typeof import('../../lib/openf1.api')>()),
  openF1List: (path: string) => openF1List(path),
}));

const openF1 = (sessionResults: unknown[]) =>
  openF1List.mockImplementation(async (path: string) => {
    if (path.startsWith('sessions?')) return [{ session_key: 9001 }];
    if (path.startsWith('session_result?')) return sessionResults;
    if (path.startsWith('drivers?')) return openF1Drivers;
    throw new Error(`Unexpected path ${path}`);
  });

const sessionResults = [
  { position: 1, driver_number: 63, number_of_laps: 30, duration: 90.5, gap_to_leader: 0, dnf: false, dns: false, dsq: false },
  { position: 2, driver_number: 16, number_of_laps: 30, duration: 90.75, gap_to_leader: 0.25, dnf: false, dns: false, dsq: false },
];

const ago = (hours: number) => DateTime.now().minus({ hours });

const practice = (end: DateTime) => ({ type: 'practice', number: 1, start: end.minus({ hours: 1 }).toJSDate(), end: end.toJSDate() });

const sessionResult = (session = 'practice-1', uid = players.player.uid) =>
  call(sessionResultCall, { season: seasonId, round: 1, session }, uid) as Promise<IDriverSessionResult[]>;

const stored = () =>
  getFirestore()
    .doc(documentPaths.sessionResult(seasonId, 1, 'practice-1'))
    .get()
    .then(snapshot => snapshot.data());

describe('session result', () => {
  beforeEach(async () => {
    openF1List.mockReset();
    openF1(sessionResults);
    await writePlayers('player', 'bookie');
    await writeRace(1, { circuitId: 10, schedule: [practice(ago(2))] });
  });

  it('should deny the result, when no one is logged in', async () => {
    await expectError(call(sessionResultCall, { season: seasonId, round: 1, session: 'practice-1' }), 'unauthenticated');
  });

  it('should deny the result, when the user is not a player', async () => {
    await expectError(sessionResult('practice-1', players.bookie.uid), 'permission-denied');
  });

  it('should not find a session that is not in the schedule', async () => {
    await expectError(sessionResult('practice-2'), 'not-found');
  });

  it('should not fetch a session that is not over', async () => {
    await writeRace(1, { circuitId: 10, schedule: [practice(DateTime.now().plus({ minutes: 10 }))] });
    await expectError(sessionResult(), 'failed-precondition');
    expect(openF1List).not.toHaveBeenCalled();
  });

  it('should fetch the result from OpenF1 the first time, and read it from Firestore afterwards', async () => {
    const first = await sessionResult();
    expect(openF1List).toHaveBeenCalledWith('sessions?year=9999&circuit_key=10&session_name=Practice 1');
    expect(first.map(r => [r.driver.driverId, r.position, r.duration, r.gapToLeader])).toEqual([
      ['rus', 1, 90_500, 0],
      ['lec', 2, 90_750, 250],
    ]);
    expect(await stored()).toBeDefined();

    openF1List.mockClear();
    const second = await sessionResult();
    expect(openF1List).not.toHaveBeenCalled();
    expect(second).toEqual(first);
  });

  it('should not store the result right after the session, as OpenF1 may correct it', async () => {
    await writeRace(1, { circuitId: 10, schedule: [practice(DateTime.now().minus({ minutes: 10 }))] });
    expect(await sessionResult()).toHaveLength(2);
    expect(await stored()).toBeUndefined();
  });

  it('should not store an empty result', async () => {
    openF1([]);
    expect(await sessionResult()).toEqual([]);
    expect(await stored()).toBeUndefined();
  });
});
