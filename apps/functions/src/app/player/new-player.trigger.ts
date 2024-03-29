import { Player } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { log } from 'firebase-functions/logger';
import { region } from 'firebase-functions/v1';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { collectionPaths, sendNotification } from '../../lib';

export const newPlayerTrigger = region('europe-west1').firestore.document('players/{playerId}')
  .onCreate(async (snapshot: DocumentSnapshot) => {

    const db = getFirestore();
    const newPlayer: Player = snapshot.data() as Player;
    const admins = (await db.collection(collectionPaths.players()).where('roles', 'array-contains', 'admin').get()).docs.map(d => d.data()) as Player[];
    log(`Found ${admins.length} admins`);

    return Promise.all(admins
      .filter(a => a.tokens && a.tokens.length)
      .map(a => sendNotification(a.tokens, 'Ny spiller!', `${newPlayer.displayName} har tilmeldt sig!`)),
    );
  });
