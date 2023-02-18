import { pipe } from "rxjs";
import { filter, map, pairwise, shareReplay, startWith } from 'rxjs/operators';
import { deepCompare as deepCompareDefault } from './compare-utils';
import { isNullish } from "./utils";

export const truthy = <T>() => pipe(filter((a: T) => !!a));
export const notNullish = <T>() => pipe(filter((a: T) => !isNullish(a)));
export const falshy = <T>() => pipe(filter((a: T) => !a));
export const shareLatest = <T>() => pipe(shareReplay<T>({ refCount: true, bufferSize: 1 }));

export const filterEquals = <T>(deepCompare = deepCompareDefault) => pipe(
  startWith<T>(null as T),
  pairwise(),
  filter(([previous, current]) => !deepCompare(previous, current)),
  map(([previous, current]) => current)
);