import { ISeason, WBC } from '@f2020/data';
import { firebaseApp } from './firebase';

export const moveToNewWBCModel = async () => {

  const oldSeason = await firebaseApp.datebase.doc(`seasons/2020`).get().then(snapshot => snapshot.data());
  const wbc: WBC = { 
    latestWBCJoinDate: oldSeason.latestWBCJoinDate, 
    results: oldSeason.wbc,
  }

  return firebaseApp.datebase.doc(`seasons/2020`).update(<ISeason> {
    wbc
  });

}