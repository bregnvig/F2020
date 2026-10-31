import { inject, Service } from '@angular/core';
import { IDriver, IDriverSector, ILiveSessionDriver, IRace, IRaceSession, isRaceSession, mapper, openF1SessionName } from '@f2020/data';
import { Interval, Lap, Position, Session, Stint } from '@f2020/openf1';
import { shareLatest } from '@f2020/tools';
import { DateTime } from 'luxon';
import { BehaviorSubject, combineLatest, map, Observable, of, retry, scan, switchMap, takeWhile, tap } from 'rxjs';
import { forSession, historyRetry, latestByDriver, mergeLaps, withLiveUpdates } from './live-utils';
import { OpenF1HttpService } from './openf1-http.service';
import { OpenF1WSSService } from './openf1-wss.service';
import { LiveStatus } from './race-result.service';

/** The live updates go on for a while after the session is planned to end, to allow for red flags */
const overtime = { hours: 1 };

/** The times of a session while it is driven, e.g. a practice. Provide it with OpenF1WSSService in the component showing one session */
@Service({ autoProvided: false })
export class SessionTimingService {
  #openF1HttpService = inject(OpenF1HttpService);
  #openF1WSSService = inject(OpenF1WSSService);

  #status$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  readonly status = this.#status$.asObservable();

  #session$?: Observable<{ session: Session; drivers: IDriver[] }>;
  #laps$?: Observable<Lap[]>;

  getTiming(race: IRace, raceSession: IRaceSession): Observable<ILiveSessionDriver[]> {
    const byPosition = isRaceSession(raceSession);
    return this.#session(race, raceSession).pipe(
      switchMap(({ session, drivers }) =>
        combineLatest({
          positions: this.#latest(raceSession, this.#openF1HttpService.getPositions(session.session_key), this.#openF1WSSService.positions$, session),
          intervals: byPosition
            ? this.#latest<Interval>(raceSession, this.#openF1HttpService.getIntervals(session.session_key), this.#openF1WSSService.intervals$, session)
            : of([]),
          stints: this.#untilOver(
            raceSession,
            withLiveUpdates(this.#openF1HttpService.getStints(session.session_key), this.#openF1WSSService.stints$.pipe(forSession(session.session_key)), this.#status$),
          ).pipe(scan((previous: Stint[], current) => [...previous, ...current], [])),
          laps: this.#laps(race, raceSession),
        }).pipe(map(({ positions, intervals, stints, laps }) => mapper.liveSession({ positions, intervals, stints, laps, drivers, byPosition }))),
      ),
      tap(results => this.#status$.next({ latestUpdate: DateTime.now(), info: `${results.length} drivers` })),
    );
  }

  /** The sectors of the lap each driver is on */
  getSectors(race: IRace, raceSession: IRaceSession): Observable<IDriverSector[]> {
    return this.#session(race, raceSession).pipe(switchMap(({ drivers }) => this.#laps(race, raceSession).pipe(map(laps => mapper.sectors({ laps, drivers })))));
  }

  /** The OpenF1 session and its drivers, as a practice may have drivers who don't race */
  #session(race: IRace, raceSession: IRaceSession) {
    if (!this.#session$) {
      this.#openF1WSSService.initializeClient();
      this.#session$ = this.#openF1HttpService.getSession(race, openF1SessionName(raceSession)).pipe(
        retry(historyRetry),
        switchMap(session => this.#openF1HttpService.getDrivers(session.session_key).pipe(map(drivers => ({ session, drivers: mapper.drivers(drivers) })))),
        shareLatest(),
      );
    }
    return this.#session$;
  }

  /** The timing and the sectors both use the laps */
  #laps(race: IRace, raceSession: IRaceSession): Observable<Lap[]> {
    if (!this.#laps$) {
      this.#laps$ = this.#session(race, raceSession).pipe(
        switchMap(({ session }) =>
          this.#untilOver(
            raceSession,
            withLiveUpdates(this.#openF1HttpService.getLaps(session.session_key), this.#openF1WSSService.laps$.pipe(forSession(session.session_key)), this.#status$),
          ),
        ),
        scan(mergeLaps, [] as Lap[]),
        shareLatest(),
      );
    }
    return this.#laps$;
  }

  /** The latest of each driver, e.g. the position */
  #latest<T extends Position | Interval>(raceSession: IRaceSession, history$: Observable<T[]>, live$: Observable<T | undefined>, session: Session): Observable<T[]> {
    return this.#untilOver(raceSession, withLiveUpdates(history$, live$.pipe(forSession(session.session_key)), this.#status$)).pipe(
      scan(latestByDriver<T>(), new Map<number, T>()),
      map(latest => [...latest.values()]),
    );
  }

  #untilOver<T>(raceSession: IRaceSession, source$: Observable<T>): Observable<T> {
    return source$.pipe(takeWhile(() => DateTime.now() < raceSession.end.plus(overtime)));
  }
}
