import { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { firestoreUtils } from './firestore-utils';

export const converter = {
  toFirestore<T>(data: T): DocumentData {
    return firestoreUtils.convertDateTimes(data);
  },
  fromFirestore<T>(
    data: QueryDocumentSnapshot,
  ): T {
    return firestoreUtils.convertTimestamps(data.data());
  },
};
