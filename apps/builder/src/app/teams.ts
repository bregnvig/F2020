import { ErgastConstructorStanding, ErgastDriver, IRace, ITeam, mapper } from '@f2020/data';
import { getConstructorDrivers, getConstructorStandings } from '@f2020/ergast-api';
import { WriteResult } from '@google-cloud/firestore';
import { firestoreUtils } from './converter/firestore-utils';
import { firebaseApp } from './firebase';

export const getTeams = async (seasonId: number): Promise<Map<string, ITeam>> => {

  const constructors: ErgastConstructorStanding[] = await getConstructorStandings(seasonId);

  const drivers: ErgastDriver[][] = await Promise.all(constructors.map(async c => await getConstructorDrivers(seasonId, c.Constructor.constructorId)));
  // console.log(drivers);

  return constructors.reduce((acc, c, index) => {
    return acc.set(c.Constructor.constructorId, mapper.team(c, drivers[index]));
  }, new Map<string, ITeam>());

};

export const writeTeams = (seasonId: number, teams: Map<string, ITeam>): Promise<number> => {
  const db = firebaseApp.datebase;
  const teamsCollection = db.collection(`seasons/${seasonId}/teams`);

  return db.runTransaction(transaction => {
    [...teams.entries()]
      .forEach(([teamId, team]) =>
        transaction.set(teamsCollection.doc(teamId), firestoreUtils.convertTimestamps(team)),
      );
    return Promise.resolve(teams.size);
  });
};


export const assignTeamsToSeason = async (seasonId: number): Promise<WriteResult[]> => {

  const teams: ITeam[] = await firebaseApp.datebase.collection(`seasons/${seasonId}/teams`)
    .get()
    .then(s => s.docs.map(doc => doc.data() as ITeam));

  console.log(teams);

  const startingIndex = await firebaseApp.datebase.collection('seasons/${seasonId}/races').get().then(snap => snap.docs.filter(d => (d.data() as IRace).selectedTeam).length);

  return firebaseApp.datebase.collection(`seasons/${seasonId}/races`)
    .where('state', '==', 'waiting')
    .get()
    .then(snapshot => {
      return Promise.all(snapshot.docs.map((s, index) => {
        return s.ref.update({
          selectedTeam: teams[(startingIndex + index) % teams.length]
        });
      }));
    });

};