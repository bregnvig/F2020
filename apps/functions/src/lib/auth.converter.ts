import { PlayerImpl } from './auth.model';
import { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { firestoreUtils } from './firestore-utils';

export const converter = {
  toFirestore(player: PlayerImpl): DocumentData {
    return firestoreUtils.convertDateTimes(player);
  },
  fromFirestore(
    data: QueryDocumentSnapshot,
  ): PlayerImpl {
    return new PlayerImpl(firestoreUtils.convertTimestamps(data.data()));
  },
};
