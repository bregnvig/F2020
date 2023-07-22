import { Player } from '@f2020/data';
import { log } from 'firebase-functions/logger';
import { region } from 'firebase-functions/v1';

;

export const setAnonymousRole = region('europe-west1').firestore.document('players/{userId}')
  .onCreate(async (snap) => {
    const newUser: Player = snap.data() as Player;
    if (!newUser.roles || newUser.roles.length) {
      log(newUser?.displayName, ' with uid ', newUser?.uid, 'has signed up, assigning a default role');
    }
    return newUser.roles?.length
      ? Promise.resolve()
      : snap.ref.update({
        roles: ['anonymous'],
      });
  });    
