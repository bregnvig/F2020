import { DateTime } from 'luxon';

export const ensureArray = <T>(value: T | T[]): T[] | null => {
  if (value === null) {
    return null;
  }
  return Array.isArray(value) ? value : [value];
};

export const arrayContainsAll = <T extends number | string | boolean | DateTime>(a: T[], b: T[]): boolean => {
  if (a === b) {
    return true;
  }
  if (!Array.isArray(a) || !Array.isArray(b)) {
    throw new Error(`Input must be arrays. A: ${Array.isArray(a)} B: ${Array.isArray(b)}`);
  }
  const compareValueFn = (a: T): number | string | boolean => a instanceof DateTime ? +a : a as number | string | boolean;
  return a.length === b.length && a.every(a => b.some(element => compareValueFn(element) === compareValueFn(a)));
};
