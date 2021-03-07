import firebase from 'firebase/app';
import 'firebase/firestore';
import { firestoreUtils } from '../firestore-utils';
import { Transaction } from '../model';


export const converter = {
  toFirestore(transaction: Transaction): firebase.firestore.DocumentData {
    return firestoreUtils.convertDateTimes(transaction);
  },
  fromFirestore(
    snapshot: firebase.firestore.QueryDocumentSnapshot,
  ): Transaction {
    const data = snapshot.data()!;
    return firestoreUtils.convertTimestamps(data);
  }
};
