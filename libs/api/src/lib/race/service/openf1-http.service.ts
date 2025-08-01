import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { IRace } from '@f2020/data';
import { Lap, openF1Url, PitStop, Position, Session, TeamRadio as OpenF1TeamRadio } from '@f2020/openf1';
import { requiredValue, shareLatest } from '@f2020/tools';
import { DateTime } from 'luxon';
import { catchError, combineLatest, defer, map, MonoTypeOperatorFunction, Observable, of, pipe, retry, shareReplay, switchMap, tap } from 'rxjs';

const sessionKey = (race: IRace, session: 'Race' | 'Qualifying') => `${session}-${race.circuitId}`;
const sessionCache = new Map<string, Observable<Session>>();
const toISOOptions = { includeOffset: false, suppressMilliseconds: true };

@Injectable({
  providedIn: 'root',
})
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

  getSession(race: IRace, sessionName: 'Race' | 'Qualifying'): Observable<Session> {
    const key = sessionKey(race, sessionName);
    if (!sessionCache.has(key)) {
      const session = JSON.parse(localStorage.getItem(key)) as Session | null;
      const session$ = session
        ? of(session)
        : this.#ready.pipe(
          switchMap(() => this.#http.get<Session[]>(openF1Url.session(race.season, race.circuitId, sessionName), { headers: this.#headers })),
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
        positions: this.#http.get<Position[]>(openF1Url.positions(sessionKey) + positionQuery, { headers: this.#headers }),
        laps: this.#http.get<Lap[]>(openF1Url.labs(sessionKey) + lapsQuery, { headers: this.#headers }),
      })),
      this.retryWithNewToken(),
    );
  }

  getPositions(sessionKey: number): Observable<Position[]> {
    return this.#ready.pipe(
      switchMap(() => this.#http.get<Position[]>(openF1Url.positions(sessionKey), { headers: this.#headers })),
      this.retryWithNewToken(),
    );
  }


  getTeamRadio(race: IRace, sessionKey: number, positionAfter?: DateTime): Observable<OpenF1TeamRadio[]> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const positionQuery = `&date<=${latestEndTime.toISO(toISOOptions)}` + (positionAfter ? `&date_start>=${positionAfter.toISO(toISOOptions)}` : '');
    return this.#ready.pipe(
      switchMap(() => this.#http.get<OpenF1TeamRadio[]>(openF1Url.radio(sessionKey) + positionQuery, { headers: this.#headers })),
      this.retryWithNewToken(),
    );
  }

  getPitStops(sessionKey: number) {
    return this.#ready.pipe(
      switchMap(() => this.#http.get<PitStop[]>(openF1Url.pitStops(sessionKey))),
      this.retryWithNewToken(),
    );
  }

  retryWithNewToken = <T>(): MonoTypeOperatorFunction<T> => pipe(retry({
    delay: (error, retryCount) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && retryCount < 3) {
        return this.getToken();
      }
      throw new Error(`Failed to fetch data after ${retryCount} retries: ${error.message}`);
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
