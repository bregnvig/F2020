import { Lap } from '@f2020/openf1';
import { isTruthy } from '@f2020/tools';
import { DateTime } from 'luxon';
import { BehaviorSubject, catchError, combineLatest, filter, map, MonoTypeOperatorFunction, Observable, of, retry } from 'rxjs';
import { LiveStatus } from './race-result.service';

export const historyRetry = { count: 3, delay: 5000 };

export const mergeLaps = (previousLaps: Lap[], currentLaps: Lap[]) => {
  const lapMap = new Map(previousLaps.map(lap => [`${lap.lap_number}-${lap.driver_number}`, lap]));

  return Array.from(
    currentLaps.reduce((map, lap) =>
      map.set(`${lap.lap_number}-${lap.driver_number}`, lap), lapMap,
    ).values(),
  );
};

/** Keeps the latest entry of each driver, as the mappers only use that */
export const latestByDriver = <T extends { driver_number: number }>(isNewer: (current: T, previous: T) => boolean = () => true) =>
  (previous: Map<number, T>, current: T[]) => current.reduce((map, item) => {
    const existing = map.get(item.driver_number);
    return !existing || isNewer(item, existing) ? map.set(item.driver_number, item) : map;
  }, new Map(previous));

/** The live updates are for the session being driven, which may not be the one shown */
export const forSession = <T extends { session_key: number }>(sessionKey: number): MonoTypeOperatorFunction<T | undefined> =>
  filter(item => !item || item.session_key === sessionKey);

/**
 * Combines the history from the HTTP API with the live updates. A failed history is retried and then reported in the status,
 * while the live updates keep coming
 */
export const withLiveUpdates = <T>(history$: Observable<T[]>, live$: Observable<T | undefined>, status$: BehaviorSubject<LiveStatus>): Observable<T[]> =>
  combineLatest([
    history$.pipe(
      retry(historyRetry),
      catchError(error => {
        console.error(error);
        status$.next({ latestUpdate: DateTime.now(), error });
        return of<T[]>([]);
      }),
    ),
    live$,
  ]).pipe(
    map(([history, update], index) => (index === 0 ? [...history, update] : [update]).filter(isTruthy)),
  );
