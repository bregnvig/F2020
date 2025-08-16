import { requiredValue } from '@f2020/tools';
import { CallableRequest, onCall } from 'firebase-functions/v2/https';
import { internalError, logAndCreateError, openF1Api, validateAccess } from '../../lib';

export const getToken = onCall(async (request: CallableRequest<void>) => {
  return validateAccess(request.auth?.uid, 'player')
    .then(async () => openF1Api.token())
    .then(token => {
      if (!token) throw logAndCreateError('not-found', 'Token not found');
      return ({ token: token.access_token, expiresIn: parseInt(token.expires_in) });
    })
    .catch(internalError);
});
