import { region } from 'firebase-functions/v1';
import { validateAccess } from '../../lib';
;

export const version = region('europe-west1').https.onCall(async (data: any, context) => {
  return validateAccess(context.auth?.uid, 'player')
    .then(() => ({
      api: 2,
      ui: 2
    }));
});
