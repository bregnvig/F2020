import { championshipPoints, IRace, ITeam, ITeamRound, ITeamStandings } from '@f2020/data';
import { Driver, Session, SessionResult, TeamChampionship } from '@f2020/openf1';
import { firebaseApp } from './firebase';
import { fetchJson, findSession, getCompletedRaces } from './fix-driver-standings';

interface Weekend {
  race: IRace;
  raceSession: Session;
  /** Missing on a weekend without a sprint */
  sprintSession?: Session;
  championship: TeamChampionship[];
}

/** The team of the winner, by the OpenF1 name the team had in the session */
const winningTeam = async (session: Session | undefined): Promise<string | undefined> => {
  if (!session) return undefined;
  const winner = await fetchJson<SessionResult[]>(`https://api.openf1.org/v1/session_result?session_key=${session.session_key}`).then(results =>
    results.find(r => r.position === 1),
  );
  const drivers = await fetchJson<Driver[]>(`https://api.openf1.org/v1/drivers?session_key=${session.session_key}`);
  return drivers.find(d => d.driver_number === winner?.driver_number)?.team_name;
};

const weekendOf = async (seasonId: number, race: IRace): Promise<Weekend> => {
  const raceSession = await findSession(seasonId, race, 'Race');
  if (!raceSession) {
    throw new Error(`No OpenF1 race session for round ${race.round} ${race.name}`);
  }
  const sprintSession = await findSession(seasonId, race, 'Sprint');
  const championship = await fetchJson<TeamChampionship[]>(`https://api.openf1.org/v1/championship_teams?session_key=${raceSession.session_key}`);
  return { race, raceSession, sprintSession, championship };
};

/**
 * Rebuilds the championship of the teams in seasons/{seasonId}/standings/teams from OpenF1, from all completed races in Firestore.
 * Teams are matched by name with seasons/{seasonId}/teams.
 *
 * - The points and positions, current and before the last weekend
 * - The wins, which are the race and sprint wins of the drivers of the team, the same way the drivers' wins are counted
 * - The place and points after each race
 *
 * Nothing is written unless `write` is true.
 */
export const fixTeamStandings = async (seasonId: number, write: boolean) => {
  const db = firebaseApp.database;
  const completedRaces = await getCompletedRaces(seasonId);
  if (!completedRaces.length) {
    console.log(`No completed races in season ${seasonId}`);
    return;
  }

  const teamsPath = `seasons/${seasonId}/teams`;
  const teams = await db
    .collection(teamsPath)
    .get()
    .then(snapshot => snapshot.docs.map(doc => doc.data() as ITeam));
  const findTeam = (name: string) => {
    const team = teams.find(t => t.name === name);
    if (!team) {
      console.warn(`No team named ${name}. Skipped`);
    }
    return team;
  };

  const wins = new Map<string, number>();
  const rounds: Record<string, Record<number, ITeamRound>> = {};
  let last: Weekend | undefined;
  for (const race of completedRaces) {
    const weekend = await weekendOf(seasonId, race);
    const winners = [await winningTeam(weekend.raceSession), await winningTeam(weekend.sprintSession)].filter(name => !!name);
    console.log(`Round ${race.round} ${race.name}: winners ${winners.join(', ')}`);
    winners.forEach(name => wins.set(name, (wins.get(name) ?? 0) + 1));
    weekend.championship.forEach(c => {
      const team = findTeam(c.team_name);
      if (team) {
        rounds[team.constructorId] = { ...rounds[team.constructorId], [race.round]: { position: c.position_current, points: c.points_current } };
      }
    });
    last = weekend;
  }
  console.log(`Last completed race is round ${last.race.round} ${last.race.name}`);

  const sprint = last.sprintSession
    ? new Map((await fetchJson<TeamChampionship[]>(`https://api.openf1.org/v1/championship_teams?session_key=${last.sprintSession.session_key}`)).map(c => [c.team_name, c]))
    : undefined;
  const standings: ITeamStandings = Object.fromEntries(
    last.championship
      .sort((a, b) => a.position_current - b.position_current)
      .map(c => {
        const team = findTeam(c.team_name);
        return team && [team.constructorId, { ...championshipPoints(c, sprint?.get(c.team_name)), wins: wins.get(c.team_name) ?? 0, rounds: rounds[team.constructorId] ?? {} }];
      })
      .filter(entry => !!entry),
  );

  console.table(Object.entries(standings).map(([constructorId, { rounds, ...standing }]) => ({ constructorId, ...standing, rounds: Object.keys(rounds).length })));

  const path = `seasons/${seasonId}/standings/teams`;
  if (write) {
    await db.doc(path).set(standings);
    console.log(`Wrote ${Object.keys(standings).length} teams to ${path}`);
  } else {
    console.log(`Dry run. Pass --write to write ${Object.keys(standings).length} teams to ${path}`);
  }
};
