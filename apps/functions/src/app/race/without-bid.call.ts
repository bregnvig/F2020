import { region } from 'firebase-functions/v1';
import { internalError, validateAccess } from '../../lib';
import { playerWithoutBid } from './../../lib/reminder.service';

;

export const withoutBid = region('europe-west1').https.onCall(async (data: unknown, context) => {
  return validateAccess(context.auth?.uid, 'admin')
    .then(() => playerWithoutBid())
    .catch(internalError);
});
