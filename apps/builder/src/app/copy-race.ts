// import { firestoreUtils } from '@f2020/data';
import { IRace } from '@f2020/data';
import { converter } from './converter';
import { firebaseApp } from './firebase';

export const copyRace = async (currentRaceId: number, newRaceId: number): Promise<any> => {
  const db = firebaseApp.datebase;

  return Promise.all([
    db.doc(`seasons/2021/races/${currentRaceId}`).get(),
    db.collection(`seasons/2021/races/${currentRaceId}/bids`).get()]
  ).then(([snapshot, bids]) => {
    const race = ({
      ...snapshot.data(),
      round: newRaceId
    } as IRace)
    Promise.all([
      db.doc(`seasons/2021/races/${newRaceId}`).withConverter(converter.race).set(race),
      ...bids.docs.map(doc => db.doc(`seasons/2021/races/${newRaceId}/bids/${doc.id}`).set(doc.data()))
    ])
  });
};


