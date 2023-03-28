import { firestore } from 'firebase-admin';
import { converter } from './auth.converter';
import { PlayerImpl } from './auth.model';
import { playersURL } from './collection-names';

export const getUser = async (uid: string): Promise<PlayerImpl | undefined> => {
  return firestore().doc(`${playersURL}/${uid}`).withConverter(converter).get().then(ref => ref.data());
};
