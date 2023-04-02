export const isNullish = <T>(value: T | null | undefined): value is T => value === null || value === undefined;

export const unfreeze = <T>(value: T): T => {
  if (typeof value !== 'object' || value['constructor']['name'] !== 'Object') {
    return value;
  }
  return Object.fromEntries(Object.entries(value || {}).map(([key, value]) => [key, unfreeze(value)])) as T;
};