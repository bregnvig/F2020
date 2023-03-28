import { IRace } from '@f2020/data';
import { firestore } from 'firebase-admin';
import { WriteResult } from 'firebase-admin/firestore';
import { converter, currentSeason } from './';
import { racesURL, seasonsURL } from './collection-names';
const currentRaceURL = (seasonId: string | number) => `${seasonsURL}/${seasonId}/${racesURL}`;

export const getCurrentRace = async (state: 'open' | 'closed'): Promise<IRace | undefined> => {
  return currentSeason().then(season => firestore()
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
  return currentSeason().then(season => firestore()
    .doc(`${currentRaceURL(season.id)}/${round}`)
    .withConverter<IRace>(converter.timestamp)
    .get()
    .then(snapshot => snapshot.data())
  );
};

export const updateRace = async (seasonId: number, round: number, race: Partial<IRace>): Promise<WriteResult> => {
  console.log(`Updating race season/${seasonId}/races/${round}`, race);
  return firestore()
    .doc(`${currentRaceURL(seasonId)}/${round}`)
    .update(race);
};
