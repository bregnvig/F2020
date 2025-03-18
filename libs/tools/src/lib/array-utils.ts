import { DateTime } from 'luxon';

export const ensureArray = <T>(value: T | T[]): T[] | null => {
  if (value === null) {
    return null;
  }
  return Array.isArray(value) ? value : [value];
};

const arrayContainsAll = <T extends number | string | boolean | DateTime>(a: T[], b: T[]): boolean => {
  if (a === b) {
    return true;
  }
  if (!Array.isArray(a) || !Array.isArray(b)) {
    throw new Error(`Input must be arrays. A: ${Array.isArray(a)} B: ${Array.isArray(b)}`);
  }
  const compareValueFn = (a: T): number | string | boolean => a instanceof DateTime ? +a : a as number | string | boolean;
  return a.length === b.length && a.every(a => b.some(element => compareValueFn(element) === compareValueFn(a)));
};

function toRecord<T>(array: T[], property: keyof T): Record<string, T>
function toRecord<T, K extends keyof T>(array: T[], property: keyof T, valueProperty: K): Record<string, T[K]>
function toRecord<T, K extends keyof T>(array: T[], property: keyof T, valueProperty?: K): Record<string, T | T[K]> {
  return Object.fromEntries(array.map(element => [element[property], valueProperty ? element[valueProperty] : element]));
}

const toMapArray = <T, K = string>(propertyOrFn: keyof T | ((item: T) => K)) => (acc: Map<K, T[]>, item: T): Map<K, T[]> => {
  const key = (typeof propertyOrFn === 'function' ? propertyOrFn(item) : `${item[propertyOrFn]}`) as K;
  return acc.set(key, [...(acc.get(key) || []), item]);
};

export type SortDirection = 'asc' | 'desc';
export type KeyOrGetFn<T> = keyof T | ((obj: T) => T[keyof T] | any);
export type GetFn<T, V = void> = ((obj: T) => V extends void ? (T[keyof T] | string | number) : V);

const getSortValue: <T>(a: T, b: T, getFn: GetFn<T>) => number = <T>(a: T, b: T, getFn: GetFn<T>) => {
  const aValue = getFn(a);
  const bValue = getFn(b);

  const isBothNumbers = !isNaN(+aValue) && !isNaN(+bValue);
  if (isBothNumbers) {
    return +aValue - +bValue;
  }

  const isAOrBNumber = !isNaN(+aValue) || !isNaN(+bValue);
  if (isAOrBNumber) {
    return !isNaN(+aValue) ? -1 : 1;
  }

  return `${aValue}`.toLocaleLowerCase().localeCompare(`${bValue}`.toLocaleLowerCase());
};

const propertySort = <T>(keyOrGetFn: KeyOrGetFn<T>, direction: SortDirection = 'asc') => {
  const getFn = typeof keyOrGetFn === 'function' ? keyOrGetFn : (obj: T) => obj[keyOrGetFn];
  return (a: T, b: T) => getSortValue(a, b, getFn) * (direction === 'desc' ? -1 : 1);
};

const findDeleted = <T extends string | number>(previous: T[], current: T[]): T[] => previous.filter(p => !current.some(c => c === p));
const findAdded = <T extends string | number>(previous: T[], current: T[]): T[] => current.filter(c => !previous.some(p => p === c));
const intersection = <T>(arrays: T[][]): T[] => {
  return arrays.reduce((acc, array) => acc.filter(element => array.includes(element)));
};

export const arrayUtils = {
  ensureArray,
  arrayContainsAll,
  toRecord,
  toMapArray,
  propertySort,
  findDeleted,
  findAdded,
  intersection,
};
