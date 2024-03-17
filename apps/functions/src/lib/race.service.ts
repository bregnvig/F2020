import { IRace } from '@f2020/data';
import { getFirestore, WriteResult } from 'firebase-admin/firestore';
import { log } from 'firebase-functions/logger';
import { collectionPaths, converter, currentSeason, documentPaths } from './';

export const getCurrentRace = async (state: 'open' | 'closed'): Promise<IRace | undefined> => {
  return currentSeason().then(season => getFirestore()
    .collection(collectionPaths.races(season.id))
    .where('state', '==', state)
    .withConverter<IRace>(converter.timestamp)
    .get()
    .then(snapshot => {
      if (snapshot.docs.length === 1) {
        return snapshot.docs[0].data();
      } else if (snapshot.docs.length > 1) {
        return Promise.reject(`Found ${snapshot.docs.length} with state open`);
      }
      return undefined;
    }));
};

export const getRaceByRound = async (round: string | number): Promise<IRace | undefined> => {
  return currentSeason().then(season => getFirestore()
    .doc(documentPaths.race(season.id, round))
    .withConverter<IRace>(converter.timestamp)
    .get()
    .then(snapshot => snapshot.data()),
  );
};

export const updateRace = async (seasonId: number, round: number, race: Partial<IRace>): Promise<WriteResult> => {
  log(`Updating race season/${seasonId}/races/${round}`, race);
  return getFirestore()
    .doc(documentPaths.race(seasonId, round))
    .update(race);
};
