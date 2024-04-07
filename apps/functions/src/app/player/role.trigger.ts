import { Player } from '@f2020/data';
import { log } from 'firebase-functions/logger';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

export const setAnonymousRole = onDocumentCreated('players/{userId}', async event => {
  const newUser: Player = event.data.data() as Player;
  if (!newUser.roles || newUser.roles.length) {
    log(newUser?.displayName, ' with uid ', newUser?.uid, 'has signed up, assigning a default role');
  }
  return newUser.roles?.length
    ? Promise.resolve()
    : event.data.ref.update({
      roles: ['anonymous'],
    });
});
