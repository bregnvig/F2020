import { IRace } from '@f2020/data';
import { CallableRequest, onCall } from 'firebase-functions/https';
import { internalError, setSprintStandings, validateAccess } from '../../lib';

/**
 * Updates the driver and team standings after the sprint, while the race is closed
 */
export const sprintStandingCall = onCall(async (request: CallableRequest<IRace>) => {
  return validateAccess(request.auth?.uid, 'admin')
    .then(() => setSprintStandings(request.data))
    .catch(internalError);
});
