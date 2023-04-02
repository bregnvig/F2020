import { IRace, RaceUpdatedBy } from '@f2020/data';
import { firestore } from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { region } from 'firebase-functions/v1';
import { PlayerImpl, currentSeason, firestoreUtils, getRaceByRound, getUser, internalError, logAndCreateError, validateAccess } from '../../lib';

export const updateRace = region('europe-west1').https.onCall(async (data: IRace, context) => {
  return validateAccess(context.auth?.uid, 'admin', 'player')
    .then(() => getUser(context.auth.uid))
    .then(user => update(firestoreUtils.convertJSONDates(data), user))
    .catch(internalError);
});

const update = async (race: IRace, player: PlayerImpl): Promise<any> => {

  const db = firestore();

  const firestoreRace = await getRaceByRound(race.round);

  if (!player.isInRole('admin') && (firestoreRace.state === 'closed' || firestoreRace.state === 'completed')) {
    throw logAndCreateError('failed-precondition', `Race must be either open or waiting`);
  }
  const payload: Partial<IRace> = player.isInRole('admin') ? race : { close: race.close, selectedDriver: race.selectedDriver };
  const updatedBy: Partial<RaceUpdatedBy> = Object.fromEntries(Object.entries({
    player: {
      displayName: player.displayName,
      uid: player.uid,
      photoURL: player.photoURL
    },
    close: +race.close === +firestoreRace.close ? undefined : race.close,
    selectedDriver: race.selectedDriver === firestoreRace.selectedDriver ? undefined : race.selectedDriver,
  }).filter(([, value]) => value !== undefined));

  return currentSeason()
    .then(season => db.doc(`seasons/${season.id}/races/${race.round}`).update(firestoreUtils.convertDateTimes({
      ...payload,
      updatedBy: FieldValue.arrayUnion(updatedBy),
    })));
};  
