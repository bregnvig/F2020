import { IDriver, ITeamStandings } from '@f2020/data';
import { SessionResult, TeamChampionship } from '@f2020/openf1';
import { getFirestore } from 'firebase-admin/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { documentPaths } from '../../lib';
import { updateAndTrigger } from '../../test/functions';
import { seasonId, writeRace, writeSeason } from '../../test/fixtures';
import { standingTrigger } from './standings.trigger';

const sessionKeys = { Race: 1, Qualifying: 2, Sprint: 3 };

const openF1 = vi.hoisted(() => ({
  sprint: false,
  /** The driver numbers in the order they finished, by session key */
  results: {} as Record<number, number[]>,
  /** The championship of the teams after the session, by session key */
  teams: {} as Record<number, Partial<TeamChampionship>[]>,
}));

vi.mock('../../lib/openf1.api', async importOriginal => ({
  ...(await importOriginal<typeof import('../../lib/openf1.api')>()),
  openF1Api: {
    token: async () => ({ access_token: 'token' }),
    session: async (_token: string, _seasonId: string, _circuitId: number, name: keyof typeof sessionKeys) => {
      if (name === 'Sprint' && !openF1.sprint) throw new Error('404');
      return { session_key: sessionKeys[name] };
    },
    sessionResults: async (_token: string, sessionKey: number) =>
      (openF1.results[sessionKey] ?? []).map((driver_number, index) => ({ driver_number, position: index + 1, number_of_laps: 50 }) as SessionResult),
    startingGrid: async () => [],
    labs: async () => [],
    championDriverPoints: async () => [],
    championTeamsPoints: async (_token: string, sessionKey: number) => openF1.teams[sessionKey] ?? [],
  },
}));

const driver = (driverId: string, activeNumber: number, teamName: string): IDriver =>
  ({ driverId, name: driverId, code: driverId.toUpperCase(), teamName, activeNumber, permanentNumbers: [activeNumber] }) as IDriver;

const teams = [
  { constructorId: 'mercedes', name: 'Mercedes', drivers: ['rus', 'ant'] },
  { constructorId: 'ferrari', name: 'Ferrari', drivers: ['lec', 'ham'] },
];

const championship = (mercedes: [number, number], ferrari: [number, number]): Partial<TeamChampionship>[] => [
  { team_name: 'Mercedes', position_current: mercedes[0], points_current: mercedes[1], position_start: 1, points_start: 0 },
  { team_name: 'Ferrari', position_current: ferrari[0], points_current: ferrari[1], position_start: 2, points_start: 0 },
];

const complete = (round: number) => updateAndTrigger(standingTrigger, 'seasons/{seasonId}/races/{round}', documentPaths.race(seasonId, round), { state: 'completed' });

const readStandings = () =>
  getFirestore()
    .doc(documentPaths.standing.teams(seasonId))
    .get()
    .then(snapshot => snapshot.data() as ITeamStandings);

describe('the standing of the teams after a race', () => {
  beforeEach(async () => {
    openF1.sprint = false;
    openF1.results = { [sessionKeys.Race]: [16, 63, 44, 12], [sessionKeys.Qualifying]: [63, 16, 44, 12] };
    openF1.teams = { [sessionKeys.Race]: championship([2, 33], [1, 40]) };
    const db = getFirestore();
    await writeSeason();
    await writeRace(1, { state: 'closed', circuitId: 1 });
    await writeRace(2, { state: 'closed', circuitId: 1 });
    await db.doc(documentPaths.circuit(1)).set({ circuitId: 1, name: 'Baku', countryCode2: 'AZ', location: { lat: 0, lng: 0 } });
    await Promise.all(
      [driver('rus', 63, 'Mercedes'), driver('ant', 12, 'Mercedes'), driver('lec', 16, 'Ferrari'), driver('ham', 44, 'Ferrari')].map(d =>
        db.doc(documentPaths.driver(d.driverId)).set(d),
      ),
    );
    await Promise.all(teams.map(team => db.doc(documentPaths.team(`${seasonId}`, team.constructorId)).set(team)));
    // Mercedes won twice before
    await db.doc(documentPaths.standing.teams(seasonId)).set({ mercedes: { wins: 2 } });
  });

  it('should add the race win to the team of the winner', async () => {
    await complete(1);
    expect(await readStandings()).toMatchObject({
      ferrari: { wins: 1, points: 40, position: 1, previousPosition: 2 },
      mercedes: { wins: 2, points: 33, position: 2, previousPosition: 1 },
    });
  });

  it('should add the sprint win to the team of the sprint winner', async () => {
    openF1.sprint = true;
    openF1.results[sessionKeys.Sprint] = [63, 16];
    openF1.teams[sessionKeys.Sprint] = championship([1, 8], [2, 7]);
    await complete(1);
    expect(await readStandings()).toMatchObject({ ferrari: { wins: 1 }, mercedes: { wins: 3 } });
  });

  it('should not touch the teams, which an admin edits', async () => {
    await complete(1);
    const ferrari = await getFirestore()
      .doc(documentPaths.team(`${seasonId}`, 'ferrari'))
      .get();
    expect(ferrari.data()).toEqual(teams[1]);
  });

  it('should store the place and points of each team after each race', async () => {
    await complete(1);
    openF1.teams[sessionKeys.Race] = championship([1, 70], [2, 60]);
    await complete(2);
    const { ferrari, mercedes } = await readStandings();
    expect(ferrari.rounds).toEqual({ 1: { position: 1, points: 40 }, 2: { position: 2, points: 60 } });
    expect(mercedes.rounds).toEqual({ 1: { position: 2, points: 33 }, 2: { position: 1, points: 70 } });
  });
});
