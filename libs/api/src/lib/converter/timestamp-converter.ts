import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { firestoreWebUtils } from '../firestore-utils';


export const converterFn = <T>(): FirestoreDataConverter<T> => ({
  toFirestore(transaction: T): DocumentData {
    return firestoreWebUtils.convertDateTimes(transaction);
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): T {
    const data = snapshot.data()!;
    return firestoreWebUtils.convertTimestamps(data);
  }
});
