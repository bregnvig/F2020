import { seasonsURL } from './collection-names';
import { converter } from './';
import * as admin from 'firebase-admin';
import { logAndCreateError } from './firestore-utils';
import { ISeason } from '@f2020/data';

export const currentSeason = (): Promise<ISeason> => {
  return admin.firestore().collection(seasonsURL)
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
