import { CallableRequest, onCall } from 'firebase-functions/v2/https';
import { converter, documentPaths, internalError, logAndCreateError, validateAccess } from '../../lib';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export const deletePlayer = onCall(async (request: CallableRequest<string>) => {
  return validateAccess(request.auth?.uid, 'admin')
    .then(async () => {
      const db = getFirestore();
      const playerDoc = (await db.doc(documentPaths.player(request.data)).withConverter(converter.player).get()).data();

      if (!playerDoc) throw logAndCreateError('not-found', `Player not found: ${request.data}`);
      if (playerDoc.balance !== 0) throw logAndCreateError('failed-precondition', `Player has a balance of ${playerDoc.balance}, cannot delete player`);

      await getAuth().deleteUser(request.data);
      await db.doc(documentPaths.player(request.data)).delete();
    })
    .catch(internalError);
});
