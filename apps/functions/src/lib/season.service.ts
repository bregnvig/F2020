import { ISeason } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { collectionPaths, converter } from './';
import { logAndCreateError } from './firestore-utils';

export const currentSeason = async (): Promise<ISeason> => {
  const snapshot = await getFirestore().collection(collectionPaths.seasons())
    .where('current', '==', true)
    .withConverter<ISeason>(converter.timestamp)
    .get();
  if (snapshot.docs.length === 1) {
    return snapshot.docs[0].data();
  }
  throw logAndCreateError('failed-precondition', `Found ${snapshot.docs.length} with state open`);
};
