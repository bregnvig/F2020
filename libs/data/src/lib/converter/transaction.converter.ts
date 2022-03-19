import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { firestoreUtils } from '../firestore-utils';
import { Transaction } from '../model';


export const converter: FirestoreDataConverter<Transaction> = {
  toFirestore(transaction: Transaction): DocumentData {
    return firestoreUtils.convertDateTimes(transaction);
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): Transaction {
    const data = snapshot.data()!;
    return firestoreUtils.convertTimestamps(data);
  }
};
