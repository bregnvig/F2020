import { validateAccess } from '../../lib';
import { onCall } from 'firebase-functions/v2/https';

export const version = onCall(async request => {
  return validateAccess(request.auth?.uid, 'player')
    .then(() => ({
      api: 2,
      ui: 2,
    }));
});
