import { Player } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { log } from 'firebase-functions/logger';
import { collectionPaths, sendNotification } from '../../lib';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

export const newPlayerTrigger = onDocumentCreated('players/{playerId}', async event => {

  const db = getFirestore();
  const newPlayer = event.data.data() as Player;
  const admins = (await db.collection(collectionPaths.players()).where('roles', 'array-contains', 'admin').get()).docs.map(d => d.data()) as Player[];
  log(`Found ${admins.length} admins`);

  return Promise.all(admins
    .filter(a => a.tokens && a.tokens.length)
    .map(a => sendNotification(a.tokens, 'Ny spiller!', `${newPlayer.displayName} har tilmeldt sig!`)),
  );
});
