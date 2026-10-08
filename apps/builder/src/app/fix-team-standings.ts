import { championshipPoints, ITeam } from '@f2020/data';
import { TeamChampionship } from '@f2020/openf1';
import { firebaseApp } from './firebase';
import { fetchJson, findSession, getCompletedRaces } from './fix-driver-standings';

/**
 * Updates the points and positions, current and before the weekend, of the teams in seasons/{seasonId}/teams
 * from the OpenF1 championship after the last completed race in Firestore. Teams are matched by name.
 *
 * Nothing is written unless `write` is true.
 */
export const fixTeamStandings = async (seasonId: number, write: boolean) => {
  const db = firebaseApp.database;
  const lastRace = (await getCompletedRaces(seasonId)).at(-1);
  if (!lastRace) {
    console.log(`No completed races in season ${seasonId}`);
    return;
  }
  const raceSession = await findSession(seasonId, lastRace, 'Race');
  if (!raceSession) {
    throw new Error(`No OpenF1 race session for round ${lastRace.round} ${lastRace.name}`);
  }
  console.log(`Last completed race is round ${lastRace.round} ${lastRace.name}`);

  const teamsPath = `seasons/${seasonId}/teams`;
  const teams = await db.collection(teamsPath).get().then(snapshot => snapshot.docs.map(doc => doc.data() as ITeam));
  const championship = await fetchJson<TeamChampionship[]>(`https://api.openf1.org/v1/championship_teams?session_key=${raceSession.session_key}`);
  const updates = championship
    .sort((a, b) => a.position_current - b.position_current)
    .map(c => {
      const team = teams.find(t => t.name === c.team_name);
      if (!team) {
        console.warn(`No team named ${c.team_name}. Skipped`);
      }
      return team && { constructorId: team.constructorId, ...championshipPoints(c) };
    })
    .filter(u => !!u);

  console.table(updates);

  if (write) {
    const batch = db.batch();
    updates.forEach(({ constructorId, ...points }) => batch.set(db.doc(`${teamsPath}/${constructorId}`), points, { merge: true }));
    await batch.commit();
    console.log(`Updated ${updates.length} teams in ${teamsPath}`);
  } else {
    console.log(`Dry run. Pass --write to update ${updates.length} teams in ${teamsPath}`);
  }
};
