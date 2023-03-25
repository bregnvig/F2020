import * as functions from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v1/auth';
import { FunctionsErrorCodeCore } from 'firebase/functions';

export const internalError = (errorMessage: any) => {
  if (errorMessage instanceof HttpsError === false) {
    throw logAndCreateError('internal', errorMessage);
  }
  throw errorMessage;
};

export const logAndCreateError = (httpError: FunctionsErrorCodeCore, message: string, ...additional: any[]): functions.https.HttpsError => {
  console.error(message, ...additional);
  return new functions.https.HttpsError(httpError, message);
};