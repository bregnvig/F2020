import { firestoreUtils } from '@f2020/data';
import { firestore } from 'firebase-admin';

export const converter = {
  toFirestore<T>(data: T): firestore.DocumentData {
    return firestoreUtils.convertDateTimes(data);
  },
  fromFirestore<T>(
    data: firestore.QueryDocumentSnapshot,
  ): T {
    return firestoreUtils.convertTimestamps(data);
  }
};
