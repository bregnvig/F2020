import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { IRace } from '@f2020/data';
import { GridPosition, Interval, Lap, openF1Url, PitStop, Position, RaceControl, Session, SessionResult, Stint, TeamRadio as OpenF1TeamRadio } from '@f2020/openf1';
import { requiredValue, shareLatest } from '@f2020/tools';
import { DateTime } from 'luxon';
import { catchError, combineLatest, defer, map, MonoTypeOperatorFunction, Observable, of, pipe, retry, shareReplay, switchMap, tap, throwError } from 'rxjs';

// The season is part of the key, as a circuit is raced every year
const sessionKey = (race: IRace, session: 'Race' | 'Qualifying' | 'Sprint') => `${session}-${race.season}-${race.circuitId}`;
const sessionCache = new Map<string, Observable<Session>>();
const toISOOptions = { includeOffset: false, suppressMilliseconds: true };

@Service()
export class OpenF1HttpService {
  #functions = inject(Functions);
  #http = inject(HttpClient);
  #headers: HttpHeaders = new HttpHeaders({
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  });
  #ready: Observable<unknown> = this.getToken().pipe(
    shareLatest(),
  );
  #token?: Observable<string>;

  getSession(race: IRace, sessionName: 'Race' | 'Qualifying' | 'Sprint'): Observable<Session> {
    const key = sessionKey(race, sessionName);
    if (!sessionCache.has(key)) {
      const session = JSON.parse(localStorage.getItem(key)) as Session | null;
      const session$ = session
        ? of(session)
        : this.#ready.pipe(
          switchMap(() => this.#getList<Session>(openF1Url.session(race.season, race.circuitId, sessionName))),
          this.retryWithNewToken(),
          map(sessions => requiredValue(sessions[0], 'Session')),
          tap(session => localStorage.setItem(key, JSON.stringify(session))),
          shareReplay(1),
        );
      sessionCache.set(key, session$);
    }
    return sessionCache.get(key);
  }

  getPositionAndLabs(race: IRace, sessionKey: number): Observable<{ positions: Position[], laps: Lap[]; }> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const positionQuery = `&date<=${latestEndTime.toISO(toISOOptions)}`;
    const lapsQuery = `&date_start<=${latestEndTime.toISO(toISOOptions)}`;
    return this.#ready.pipe(
      switchMap(() => combineLatest({
        positions: this.#getList<Position>(openF1Url.positions(sessionKey) + positionQuery),
        laps: this.#getList<Lap>(openF1Url.labs(sessionKey) + lapsQuery),
      })),
      this.retryWithNewToken(),
    );
  }

  getPositions(sessionKey: number): Observable<Position[]> {
    return this.#ready.pipe(
      switchMap(() => this.#getList<Position>(openF1Url.positions(sessionKey))),
      this.retryWithNewToken(),
    );
  }

  getLaps(sessionKey: number): Observable<Lap[]> {
    return this.#ready.pipe(
      switchMap(() => this.#getList<Lap>(openF1Url.labs(sessionKey))),
      this.retryWithNewToken(),
    );
  }

  getSessionResult(sessionKey: number): Observable<SessionResult[]> {
    return this.#ready.pipe(
      switchMap(() => this.#getList<SessionResult>(openF1Url.sessionResults(sessionKey))),
      this.retryWithNewToken(),
    );
  }

  getStartingGrid(sessionKey: number): Observable<GridPosition[]> {
    return this.#ready.pipe(
      switchMap(() => this.#getList<GridPosition>(openF1Url.startingGrid(sessionKey))),
      this.retryWithNewToken(),
    );
  }

  getTeamRadio(race: IRace, sessionKey: number, positionAfter?: DateTime): Observable<OpenF1TeamRadio[]> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const positionQuery = `&date<=${latestEndTime.toISO(toISOOptions)}` + (positionAfter ? `&date_start>=${positionAfter.toISO(toISOOptions)}` : '');
    return this.#ready.pipe(
      switchMap(() => this.#getList<OpenF1TeamRadio>(openF1Url.radio(sessionKey) + positionQuery)),
      this.retryWithNewToken(),
    );
  }

  getPitStops(sessionKey: number) {
    return this.#ready.pipe(
      switchMap(() => this.#getList<PitStop>(openF1Url.pitStops(sessionKey))),
      this.retryWithNewToken(),
    );
  }

  getIntervals(sessionKey: number): Observable<Interval[]> {
    return this.#ready.pipe(
      switchMap(() => this.#getList<Interval>(openF1Url.intervals(sessionKey))),
      this.retryWithNewToken(),
    );
  }

  getRaceControl(sessionKey: number): Observable<RaceControl[]> {
    return this.#ready.pipe(
      switchMap(() => this.#getList<RaceControl>(openF1Url.raceControl(sessionKey))),
      this.retryWithNewToken(),
    );
  }

  getStints(sessionKey: number): Observable<Stint[]> {
    return this.#ready.pipe(
      switchMap(() => this.#getList<Stint>(openF1Url.stints(sessionKey))),
      this.retryWithNewToken(),
    );
  }

  /** OpenF1 answers 404 when it has no data, e.g. no team radio in a session */
  #getList<T>(url: string): Observable<T[]> {
    return this.#http.get<T[]>(url, { headers: this.#headers }).pipe(
      catchError(error => error instanceof HttpErrorResponse && error.status === 404 ? of<T[]>([]) : throwError(() => error)),
    );
  }

  retryWithNewToken = <T>(): MonoTypeOperatorFunction<T> => pipe(retry({
    delay: (error, retryCount) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && retryCount < 3) {
        return this.getToken();
      }
      console.error(`Retrying due to error: ${error.message} (retry count: ${retryCount})`, error);
      throw new Error(`See log statement`);
    },
  }));

  getToken(): Observable<string> {
    return defer(() => httpsCallable<void, { token: string; }>(this.#functions, 'getToken')().then(response => response.data.token)).pipe(
      catchError(error => {
        console.error('Failed to fetch OpenF1 token:', error);
        throw new Error('Failed to fetch OpenF1 token');
      }),
      tap(token => this.#headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      })),
    );
  }
}
