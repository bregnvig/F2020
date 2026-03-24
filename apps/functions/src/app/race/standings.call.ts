import { IRace } from '@f2020/data';
import { internalError, setStandings, validateAccess } from '../../lib';
import { CallableRequest, onCall } from 'firebase-functions/https';

/**
 * This call builds the  standing for all drivers and for each driver for a given race.
 * For each driver both result and qualify.
 */
export const standingCall = onCall(async (request: CallableRequest<IRace>) => {
  return validateAccess(request.auth?.uid, 'admin', 'player')
    .then(() => setStandings(request.data))
    .catch(internalError);
});

