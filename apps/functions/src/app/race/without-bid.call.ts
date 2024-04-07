import { internalError, validateAccess } from '../../lib';
import { playerWithoutBid } from './../../lib/reminder.service';
import { CallableRequest, onCall } from 'firebase-functions/v2/https';

export const withoutBid = onCall(async (request: CallableRequest) => {
  return validateAccess(request.auth?.uid, 'admin')
    .then(() => playerWithoutBid())
    .catch(internalError);
});
