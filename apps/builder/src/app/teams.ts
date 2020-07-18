import { WriteResult } from '@google-cloud/firestore';
import { ITeam, ErgastConstructorStanding, ErgastDriver, mapper, IRace } from '@f2020/data';
import { getContructorStandings, getConstructorDrivers } from '@f2020/ergast';
import { firebaseApp } from './firebase';

export const getTeams = async (seasonId: number): Promise<Map<string, ITeam>> => {

  const constructors: ErgastConstructorStanding[] = await getContructorStandings(seasonId);

  const drivers: ErgastDriver[][] = await Promise.all(constructors.map(async c => await getConstructorDrivers(seasonId, c.Constructor.constructorId)));
  // console.log(drivers);

  return constructors.reduce((acc, c, index) => {
    return acc.set(c.Constructor.constructorId, mapper.team(c, drivers[index]));
  }, new Map<string, ITeam>());

};

export const assignTeamsToSeason = async (seasonId: number): Promise<WriteResult[]> => {

  const teams: ITeam[] = await firebaseApp.datebase.collection(`seasons/${seasonId}/teams`)
    .get()
    .then(s => s.docs.map(doc => doc.data() as ITeam))

  return firebaseApp.datebase.collection(`seasons/${seasonId}/races`)
    .where('state', '==', 'waiting')
    .get()
    .then(snapshot => {
      return Promise.all(snapshot.docs.map((s, index) => {
        return s.ref.update({
          selectedTeam: teams[index % teams.length]
        });
      }));
    });

};