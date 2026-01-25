// import { firestoreUtils } from '@f2020/data';
import { Circuit } from '@f2020/data';
import { firebaseApp } from './firebase';
import { readFileSync } from 'fs';


const getCircuits = (): Circuit[] => {
  return JSON.parse(readFileSync('assets/circuits.json').toString());
};

export const buildCircuits = async (): Promise<number> => {
  const db = firebaseApp.database;
  const circuits = getCircuits();
  const circuitsCollection = db.collection('circuits');

  return db.runTransaction(transaction => {
    circuits
      .forEach(circuit =>
        transaction.set(circuitsCollection.doc(circuit.circuitId.toString()), circuit),
      );
    return Promise.resolve(circuits.length);
  });
};


