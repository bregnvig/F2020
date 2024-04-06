import { firebaseApp } from './firebase';

export const writeDocument = async (path: string): Promise<any> => {
  const db = firebaseApp.database;

  return db.doc(path).get()
    .then(ref => ref.data());
};

export const writeCollection = async (path: string): Promise<any[]> => {
  const db = firebaseApp.database;

  return db.collection(path).limit(50).get()
    .then(ref => ref.docs)
    .then(snapshot => snapshot.map(s => s.data()));
};
