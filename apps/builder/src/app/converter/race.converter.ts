import { IRace } from '@f2020/data';
import { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { firestoreUtils } from './firestore-utils';
export const converter = {
  toFirestore(race: IRace): DocumentData {
    return firestoreUtils.convertDateTimes(race);
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): IRace {
    const data = snapshot.data()!;
    return firestoreUtils.convertTimestamps(data);
  }
};
