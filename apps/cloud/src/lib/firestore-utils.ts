import { Timestamp } from 'firebase-admin/firestore';
import { error } from 'firebase-functions/logger';
import { HttpsError } from 'firebase-functions/v1/https';
import { FunctionsErrorCodeCore } from 'firebase/functions';
import { DateTime } from 'luxon';

export const internalError = (errorMessage: any) => {
  if (errorMessage instanceof HttpsError === false) {
    throw logAndCreateError('internal', errorMessage);
  }
  throw errorMessage;
};

export const logAndCreateError = (httpError: FunctionsErrorCodeCore, message: string, ...additional: any[]): HttpsError => {
  error(message, ...additional);
  return new HttpsError(httpError, message);
};

export const regexISODate = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.{0,1}\d*))(?:Z|(\+|-)([\d|:]*))?$/;

export const firestoreUtils = {
  convertJSONDate(value: any): any {
    const reMsAjax = /^\/Date\((d|-|.*)\)[/|\\]$/;
    if (typeof value === 'string') {
      let result = regexISODate.exec(value);
      if (result) {
        return DateTime.fromISO(value);
      } else {
        result = reMsAjax.exec(value);
        if (result) {
          const msResult = result[1].split(/[-+,.]/);
          return DateTime.fromMillis(msResult[0] ? +msResult[0] : 0 - +msResult[1]);
        }
      }
    }
    return value;
  },
  convertJSONDates(input: any): any {
    // Ignore things that aren't objects.
    if (!input || typeof input !== 'object') {
      return firestoreUtils.convertDateTime;
    }
    Object.keys(input).map(key => {
      const value = input[key];
      // Check for string properties which look like dates.
      if (typeof value === 'string') {
        input[key] = firestoreUtils.convertJSONDate(value);
      } else if (typeof value === 'object') {
        firestoreUtils.convertJSONDates(value);
      }
    });
    return input;
  },
  convertTimestamp(input: Timestamp): DateTime {
    if (input instanceof Timestamp) {
      return DateTime.fromJSDate(input.toDate());
    }
    return input;
  },
  convertTimestamps(input: any): any {
    if (!input || typeof input !== 'object') {
      return input;
    }
    Object.keys(input).map(key => {
      const value = input[key];
      if (value instanceof Timestamp) {
        input[key] = firestoreUtils.convertTimestamp(value);
      } else if (typeof value === 'object') {
        firestoreUtils.convertTimestamps(value);
      }
    });
    return input;
  },
  convertDateTime(input: any): any | Timestamp {
    if (input instanceof DateTime) {
      return Timestamp.fromMillis(input.toMillis());
    }
    return input;
  },
  convertDateTimes(input: any): any {
    if (!input || typeof input !== 'object') {
      return input;
    }
    Object.keys(input).map(key => {
      const value = input[key];
      if (value instanceof DateTime) {
        input[key] = firestoreUtils.convertDateTime(value);
      } else if (typeof value === 'object' && value) {
        firestoreUtils.convertDateTimes(value);
      }
    });
    return input;
  }
};
