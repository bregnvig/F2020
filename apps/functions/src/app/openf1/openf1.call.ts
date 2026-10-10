import { CallableRequest, onCall } from 'firebase-functions/v2/https';
import { internalError, logAndCreateError, openF1List, validateAccess } from '../../lib';

/** An endpoint and its query, e.g. `position?session_key=9161&date<=2026-05-03T23:00:00` */
const validPath = /^[a-z_]+\?[\w=&<>%:.+-]*$/;

/**
 * Gets a list from the OpenF1 REST API for the app. During a live session OpenF1 answers the CORS preflight of a browser with 401,
 * and a preflight never has the token, so the app can't call OpenF1 directly
 */
export const openF1Call = onCall(async (request: CallableRequest<{ path: string; }>) => {
  return validateAccess(request.auth?.uid, 'player')
    .then(() => {
      const path = request.data?.path;
      if (typeof path !== 'string' || !validPath.test(path)) {
        throw logAndCreateError('invalid-argument', `Not an OpenF1 path: ${path}`);
      }
      return openF1List(path);
    })
    .catch(internalError);
});
