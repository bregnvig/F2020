import { converter } from './auth.converter';
import { PlayerImpl } from './auth.model';
import { documentPaths } from './paths';
import { getFirestore } from 'firebase-admin/firestore';

export const getUser = async (uid: string): Promise<PlayerImpl | undefined> => {
  return getFirestore().doc(documentPaths.player(uid)).withConverter(converter).get().then(ref => ref.data());
};
