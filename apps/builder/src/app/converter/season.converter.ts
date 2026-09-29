// import { firestoreUtils } from '@f2020/data';
import { firestoreUtils } from './firestore-utils';
import { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { ISeason } from '@f2020/data';
export const converter = {
  toFirestore(season: ISeason): DocumentData {
    return firestoreUtils.convertDateTimes(season);
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): ISeason {
    const data = snapshot.data()!;
    return firestoreUtils.convertTimestamps(data);
  }
};
