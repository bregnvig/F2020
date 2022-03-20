import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { firestoreUtils } from '../firestore-utils';


export const converterFn = <T>(): FirestoreDataConverter<T> => ({
  toFirestore(transaction: T): DocumentData {
    return firestoreUtils.convertDateTimes(transaction);
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): T {
    const data = snapshot.data()!;
    return firestoreUtils.convertTimestamps(data);
  }
});
