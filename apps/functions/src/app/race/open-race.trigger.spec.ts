import { getFirestore } from 'firebase-admin/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { documentPaths } from '../../lib';
import { updateAndTrigger } from '../../test/functions';
import { readRace, seasonId, team, writeRace, writeSeason } from '../../test/fixtures';
import { openF1Drivers } from '../../test/openf1';
import { openRace, updateDriversSelectedTeamAndDriver } from './open-race.trigger';

vi.mock('../../lib/openf1.api', async importOriginal => ({
  ...(await importOriginal<typeof import('../../lib/openf1.api')>()),
  openF1Api: {
    token: async () => ({ access_token: 'token' }),
    drivers: async () => openF1Drivers,
  },
}));

const pattern = 'seasons/{seasonId}/races/{round}';

const ferrari = { constructorId: 'ferrari', name: 'Ferrari', drivers: ['lec', 'ham'] };

describe('open the next race', () => {
  const setState = (round: number, state: string) => updateAndTrigger(openRace, pattern, documentPaths.race(seasonId, round), { state });

  beforeEach(async () => {
    await writeSeason();
    await writeRace(1, { state: 'closed' });
    await writeRace(2, { state: 'waiting' });
  });

  it('should open the next race, when a race is completed', async () => {
    await setState(1, 'completed');
    expect((await readRace(2)).state).toBe('open');
  });

  it('should open the next race, when an open race is cancelled', async () => {
    await writeRace(1, { state: 'open' });
    await setState(1, 'cancelled');
    expect((await readRace(2)).state).toBe('open');
  });

  it('should not open the next race, when another race is open', async () => {
    await writeRace(3, { state: 'open', round: 3 });
    await setState(1, 'completed');
    expect((await readRace(2)).state).toBe('waiting');
  });

  it('should open nothing, when the last race is completed', async () => {
    await writeRace(2, { state: 'closed' });
    await setState(2, 'completed');
    expect((await readRace(1)).state).toBe('closed');
  });
});

describe('select the drivers, team and driver of a race when it opens', () => {
  const open = (round: number) => updateAndTrigger(updateDriversSelectedTeamAndDriver, pattern, documentPaths.race(seasonId, round), { state: 'open' });

  beforeEach(async () => {
    await writeSeason();
    await getFirestore()
      .doc(documentPaths.team(`${seasonId}`, team.constructorId))
      .set(team);
    await getFirestore()
      .doc(documentPaths.team(`${seasonId}`, ferrari.constructorId))
      .set(ferrari);
    await writeRace(1, { state: 'completed', selectedTeam: team });
    await writeRace(2, { state: 'waiting', drivers: [], countryCode: 'IT' });
  });

  it('should take the drivers from OpenF1, and select a team other than in the previous race', async () => {
    await open(2);
    const race = await readRace(2);
    expect(race.drivers).toEqual(['rus', 'ant', 'lec', 'ham']);
    expect(race.teams.map((t: { constructorId: string; drivers: string[] }) => [t.constructorId, t.drivers])).toEqual([
      ['ferrari', ['lec', 'ham']],
      ['mercedes', ['rus', 'ant']],
    ]);
    expect(race.selectedTeam.constructorId).toBe('ferrari');
  });

  it('should select a driver from the country of the race', async () => {
    await open(2);
    expect((await readRace(2)).selectedDriver).toBe('ant');
  });

  it('should leave the first race alone', async () => {
    await writeRace(1, { state: 'waiting', drivers: [] });
    await open(1);
    expect((await readRace(1)).drivers).toEqual([]);
  });
});
