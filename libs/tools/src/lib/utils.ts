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

export const TypedObject = {
  keys: Object.keys as <T extends object>(obj: T) => Array<keyof T>,
  values: Object.values as <T extends object>(obj: T) => Array<keyof T>,
  entries: Object.entries as <T extends object>(obj: T) => Array<[keyof T, T[keyof T]]>,
  fromEntries: Object.fromEntries as <K, V>(entries: [keyof K, V][]) => Record<keyof K, V>,
};

export const requiredValue = <T>(value: T | null | undefined, type: string): T | never => {
  if (!value) throw new Error(`Required ${type} not found`);
  return value;
};

export const filterProperties = <T>(o: Partial<T>, filterFn: (v: T[keyof T]) => boolean): Partial<T> => Object.fromEntries(Object.entries(o).filter(([, _value]: [any, any]) => filterFn(_value))) as Partial<T>;
export const filterUndefined = <T>(o: Partial<Record<string, T>>): Record<string, Exclude<T, undefined>> => Object.fromEntries(Object.entries(o).filter(([, _value]) => _value !== undefined)) as Record<string, Exclude<T, undefined>>;
export const filterNullish = <T>(o: T): Partial<T> => Object.fromEntries(Object.entries(o as any).filter(([, _value]) => !isNullish(_value))) as Partial<T>;
export const filterNullishEmptyArray = <T>(o: T): Partial<T> => Object.fromEntries(Object.entries(filterNullish(o) as any).filter(([, _value]) => !Array.isArray(_value) || _value.length)) as Partial<T>;

export const toMap = <T, K extends (string | number) = string>(propertyOrFn: keyof T | ((item: T) => K)) => (acc: Map<K, T>, item: T): Map<K, T> => {
  const key = typeof propertyOrFn === 'function' ? propertyOrFn(item) : item[propertyOrFn] as K;
  return acc.set(key, item);
};
