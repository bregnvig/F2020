export type nullish = null | undefined;
export const isNullish = <T>(value: T | nullish): value is T => value === null || value === undefined;
export const unfreeze = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map(unfreeze) as unknown as T;
  }
  if (value === null || typeof value !== 'object' || value['constructor']?.['name'] !== 'Object') {
    return value;
  }
  return Object.fromEntries(Object.entries(value || {}).map(([key, value]) => [key, unfreeze(value)])) as T;
};