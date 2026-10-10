import { inject, Service } from '@angular/core';
import { IDriver, ILiveQualifyResult, IRace, mapper, RaceControl, TeamRadio } from '@f2020/data';
import { Lap, Position, RaceControl as OpenF1RaceControl, Session } from '@f2020/openf1';
import { shareLatest } from '@f2020/tools';
import { DateTime } from 'luxon';
import { BehaviorSubject, combineLatest, map, Observable, retry, scan, switchMap, takeWhile, tap } from 'rxjs';
import { forSession, historyRetry, latestByDriver, mergeLaps, withLiveUpdates } from './live-utils';
import { OpenF1HttpService } from './openf1-http.service';
import { OpenF1WSSService } from './openf1-wss.service';
import { isQualifyLive } from './qualify-session';
import { QualifyResultService } from './qualify-result.service';
import { LiveStatus } from './race-result.service';

@Service({ autoProvided: false })
export class LiveQualifyService extends QualifyResultService {
  #openF1HttpService = inject(OpenF1HttpService);
  #openF1WSSService = inject(OpenF1WSSService);

  #resultStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #radioStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #raceControlStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  readonly resultStatus = this.#resultStatus$.asObservable();
  readonly radioStatus = this.#radioStatus$.asObservable();
  readonly raceControlStatus = this.#raceControlStatus$.asObservable();

  #raceControl$?: Observable<OpenF1RaceControl[]>;

  getResult(race: IRace, drivers: IDriver[]): Observable<ILiveQualifyResult> {
    return this.#session(race).pipe(
      switchMap(session => this.#untilOver(session, combineLatest({
        positions: withLiveUpdates(
          this.#openF1HttpService.getPositions(session.session_key),
          this.#openF1WSSService.positions$.pipe(forSession(session.session_key)),
          this.#resultStatus$,
        ).pipe(
          scan(latestByDriver<Position>(), new Map<number, Position>()),
          map(positions => [...positions.values()]),
        ),
        laps: withLiveUpdates(
          this.#openF1HttpService.getLaps(session.session_key),
          this.#openF1WSSService.laps$.pipe(forSession(session.session_key)),
          this.#resultStatus$,
        ).pipe(
          scan(mergeLaps, [] as Lap[]),
        ),
        raceControl: this.#raceControlMessages(race),
      }))),
      map(({ positions, laps, raceControl }) => mapper.liveQualifyResult({ positions, laps, raceControl, drivers, race })),
      tap(result => this.#resultStatus$.next({
        latestUpdate: DateTime.now(),
        info: `Q${result.phase}, ${result.results.length} drivers`,
      })),
    );
  }

  getRadio(race: IRace, drivers: IDriver[]): Observable<TeamRadio[] | null> {
    return this.#session(race).pipe(
      switchMap(session => this.#untilOver(session, withLiveUpdates(
        this.#openF1HttpService.getTeamRadio(race, session.session_key),
        this.#openF1WSSService.radio$.pipe(forSession(session.session_key)),
        this.#radioStatus$,
      ))),
      map(messages => mapper.radio({ messages, drivers })),
      scan((previous, current) => [...previous, ...current]),
      map(messages => messages.toSorted((a, b) => b.date.valueOf() - a.date.valueOf())),
      tap(messages => this.#radioStatus$.next({
        latestUpdate: DateTime.now(),
        info: `${messages.length} messages`,
      })),
    );
  }

  getRaceControl(race: IRace, drivers: IDriver[]): Observable<RaceControl[]> {
    return this.#raceControlMessages(race).pipe(
      map(messages => mapper.raceControl({ messages, drivers })),
      tap(messages => this.#raceControlStatus$.next({
        latestUpdate: DateTime.now(),
        info: `${messages.length} race control messages`,
      })),
    );
  }

  /** The result and the race control snackbar both use the race control messages, which tell when Q1, Q2 and Q3 start */
  #raceControlMessages(race: IRace): Observable<OpenF1RaceControl[]> {
    if (!this.#raceControl$) {
      this.#raceControl$ = this.#session(race).pipe(
        switchMap(session => this.#untilOver(session, withLiveUpdates(
          this.#openF1HttpService.getRaceControl(session.session_key),
          this.#openF1WSSService.raceControl$.pipe(forSession(session.session_key)),
          this.#raceControlStatus$,
        ))),
        scan((previous, current) => [...previous, ...current], [] as OpenF1RaceControl[]),
        shareLatest(),
      );
    }
    return this.#raceControl$;
  }

  #session(race: IRace): Observable<Session> {
    this.#openF1WSSService.initializeClient();
    return this.#openF1HttpService.getSession(race, 'Qualifying').pipe(
      retry(historyRetry),
    );
  }

  /** Stops the live updates when the qualifying is over */
  #untilOver<T>(session: Session, source$: Observable<T>): Observable<T> {
    return source$.pipe(takeWhile(() => isQualifyLive(session)));
  }
}
