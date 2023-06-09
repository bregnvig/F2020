import { OperatorFunction, pipe } from "rxjs";
import { filter, map, pairwise, shareReplay, startWith } from 'rxjs/operators';
import { deepCompare as deepCompareDefault } from './compare-utils';
import { isNullish, nullish } from "./utils";

export const notNullish = <T>() => pipe(filter((a: T) => !isNullish(a)));
export const truthy = <T>() => pipe(filter(x => !!x) as OperatorFunction<T | nullish | '', T>);
export const falsy = <T>() => pipe(filter(x => !x) as unknown as OperatorFunction<T | nullish, T extends number ? (nullish | 0) : T extends string ? (nullish | '') : nullish>);
export const withLength = <T>() => pipe(filter((a: T[]) => !!a?.length) as OperatorFunction<T[] | nullish, T[] | never>);
export const shareLatest = <T>() => pipe(shareReplay<T>({ refCount: true, bufferSize: 1 }));

export const filterEquals = <T>(deepCompare = deepCompareDefault) => pipe(
  startWith<T>(null as T),
  pairwise(),
  filter(([previous, current]) => !deepCompare(previous, current)),
  map(([previous, current]) => current)
);