import { requiredValue } from '@f2020/tools';
import { CallableRequest, onCall } from 'firebase-functions/v2/https';
import { internalError, logAndCreateError, openF1Api, validateAccess } from '../../lib';

export const getToken = onCall(async (request: CallableRequest<void>) => {
  return validateAccess(request.auth?.uid, 'player')
    .then(async () => {
      const username = requiredValue(process.env.OPEN_F1_USERNAME, 'OPEN_F1_USERNAME');
      const password = requiredValue(process.env.OPEN_F1_PASSWORD, 'OPEN_F1_PASSWORD');
      return { username, password };
    })
    .then(async ({ username, password }) => openF1Api.token(username, password))
    .then(token => {
      if (!token) throw logAndCreateError('not-found', 'Token not found');
      return ({ token: token.access_token, expiresIn: parseInt(token.expires_in) });
    })
    .catch(internalError);
});
