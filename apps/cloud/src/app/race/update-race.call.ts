import { IRace, Player, RaceUpdatedBy } from '@f2020/data';
import { firestore } from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { region } from 'firebase-functions/v1';
import { DateTime } from 'luxon';
import { currentSeason, documentPaths, firestoreUtils, getRaceByRound, getUser, internalError, logAndCreateError, PlayerImpl, sendNotification, validateAccess } from '../../lib';

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
      photoURL: player.photoURL,
    },
    close: +race.close === +firestoreRace.close ? undefined : race.close,
    selectedDriver: race.selectedDriver === firestoreRace.selectedDriver ? undefined : race.selectedDriver,
    previous: {
      close: firestoreRace.close,
      selectedDriver: firestoreRace.selectedDriver,
    },
    updatedAt: DateTime.now(),
  }).filter(([, value]) => value !== undefined));

  return currentSeason()
    .then(season => db.doc(documentPaths.race(season.id, race.round)).update(firestoreUtils.convertDateTimes({
      ...payload,
      updatedBy: FieldValue.arrayUnion({ ...updatedBy }),
    })))
    .then(() => notifyAdmin(updatedBy, race.name));
};

const notifyAdmin = async (updatedBy: Partial<RaceUpdatedBy>, raceName: string): Promise<void[]> => {

  const db = firestore();
  const admins = (await db.collection('players').where('roles', 'array-contains', 'admin').get()).docs.map(d => d.data()) as Player[];
  const driver = updatedBy.selectedDriver ? ` Udvalgte kører: ${updatedBy.selectedDriver}.` : '';
  const close = updatedBy.close ? ` Spillet lukker: ${updatedBy.close.toFormat('HH:mm')}.` : '';

  return Promise.all(admins
    .filter(a => a.tokens && a.tokens.length)
    .map(a => sendNotification(a.tokens!, `${raceName} er blevet opdateret`, `${updatedBy.player.displayName} har opdateret løb!${driver}${close}`)),
  );
};
