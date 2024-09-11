import { firebaseApp } from './firebase';

export const readDocument = async (path: string): Promise<any> => {
  const db = firebaseApp.database;

  return db.doc(path).get()
    .then(ref => ref.data());
};

export const readCollection = async (path: string): Promise<any[]> => {
  const db = firebaseApp.database;

  return db.collection(path).get()
    .then(ref => ref.docs)
    .then(snapshot => snapshot.map(s => ({ id: s.id, data: s.data() })));
};
