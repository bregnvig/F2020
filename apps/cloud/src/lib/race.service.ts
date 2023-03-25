import { IRace } from '@f2020/data';
import * as admin from 'firebase-admin';
import { converter, currentSeason } from './';
import { racesURL, seasonsURL } from './collection-names';
const currentRaceURL = (seasonId: string | number) => `${seasonsURL}/${seasonId}/${racesURL}`;

export const getCurrentRace = async (state: 'open' | 'closed'): Promise<IRace | undefined> => {
  return currentSeason().then(season => admin.firestore()
    .collection(currentRaceURL(season.id!))
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

export const getRaceByRound = async (round: string): Promise<IRace | undefined> => {
  return currentSeason().then(season => admin.firestore()
    .doc(`${currentRaceURL(season.id)}/${round}`)
    .withConverter<IRace>(converter.timestamp)
    .get()
    .then(snapshot => snapshot.data())
  );
};

export const updateRace = async (seasonId: number, round: number, race: Partial<IRace>): Promise<admin.firestore.WriteResult> => {
  console.log(`Updating race season/${seasonId}/races/${round}`, race);
  return admin.firestore()
    .doc(`${currentRaceURL(seasonId)}/${round}`)
    .update(race);
};
