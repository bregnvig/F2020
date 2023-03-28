import { ISeason } from '@f2020/data';
import { firestore } from 'firebase-admin';
import { converter } from './';
import { seasonsURL } from './collection-names';
import { logAndCreateError } from './firestore-utils';

export const currentSeason = (): Promise<ISeason> => {
  return firestore().collection(seasonsURL)
    .where('current', '==', true)
    .withConverter<ISeason>(converter.timestamp)
    .get()
    .then(snapshot => {
      if (snapshot.docs.length === 1) {
        return snapshot.docs[0].data();
      }
      throw logAndCreateError('failed-precondition', `Found ${snapshot.docs.length} with state open`);
    });
};
