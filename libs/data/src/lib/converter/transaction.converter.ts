import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { firestoreWebUtils } from '../firestore-utils';
import { Transaction } from '../model';


export const converter: FirestoreDataConverter<Transaction> = {
  toFirestore(transaction: Transaction): DocumentData {
    return firestoreWebUtils.convertDateTimes(transaction);
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): Transaction {
    const data = snapshot.data()!;
    return firestoreWebUtils.convertTimestamps(data);
  }
};
