import { IDriver } from '@f2020/data';
import { DateTime } from 'luxon';
import * as firebase from 'firebase-admin'

export const regexISODate = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.{0,1}\d*))(?:Z|(\+|-)([\d|:]*))?$/;

export const firestoreUtils = {
  convertJSONDate(value: any): any {
    const reMsAjax = /^\/Date\((d|-|.*)\)[\/|\\]$/;
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
      return this.convertJSONDate(input);
    }
    Object.keys(input).map(key => {
      const value = input[key];
      // Check for string properties which look like dates.
      if (typeof value === 'string') {
        input[key] = this.convertJSONDate(value);
      } else if (typeof value === 'object') {
        this.convertJSONDates(value);
      }
    });
    return input;
  },
  convertTimestamp(input: firebase.firestore.Timestamp): DateTime | any {
    if (input instanceof firebase.firestore.Timestamp) {
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
      if (value instanceof firebase.firestore.Timestamp) {
        input[key] = this.convertTimestamp(value);
      } else if (typeof value === 'object') {
        this.convertTimestamps(value);
      }
    });
    return input;
  },
  convertDateTime(input: any): any | firebase.firestore.Timestamp {
    if (input instanceof DateTime) {
      return firebase.firestore.Timestamp.fromMillis(input.toMillis());
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
        input[key] = this.convertDateTime(value);
      } else if (typeof value === 'object' && value ) {
        this.convertDateTimes(value);
      }
    });
    return input;
  }
};
