import { firestore } from 'firebase-admin';
import { converter } from './auth.converter';
import { PlayerImpl } from './auth.model';
import { documentPaths } from './paths';

export const getUser = async (uid: string): Promise<PlayerImpl | undefined> => {
  return firestore().doc(documentPaths.player(uid)).withConverter(converter).get().then(ref => ref.data());
};
