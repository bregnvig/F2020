import { firestore } from 'firebase-admin';
import { firestoreUtils } from './firestore-utils';

export const converter = {
  toFirestore<T>(data: T): firestore.DocumentData {
    return firestoreUtils.convertDateTimes(data);
  },
  fromFirestore<T>(
    data: firestore.QueryDocumentSnapshot,
  ): T {
    return firestoreUtils.convertTimestamps(data.data());
  },
};
