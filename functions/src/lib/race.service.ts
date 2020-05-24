import * as admin from 'firebase-admin';
import { currentSeason, converter } from './';
import { racesURL, seasonsURL } from './collection-names';
import { IRace } from "./model";
const currentRaceURL = (seasonId: string) => `${seasonsURL}/${seasonId}/${racesURL}`

export const getCurrentRace = async (state: 'open' | 'closed'): Promise<IRace | undefined> => {
  return currentSeason().then(season => admin.firestore()
    .collection(currentRaceURL(season.id!))
    .where('state', '==', state)
    .withConverter<IRace>(converter.timestamp)
    .get()
    .then(snapshot => {
      if (snapshot.docs.length === 1) {
        return snapshot.docs[0].data();
      } else if(snapshot.docs.length > 1) {
        return Promise.reject(`Found ${snapshot.docs.length} with state open`);
      }
      return undefined;
    }));
}
