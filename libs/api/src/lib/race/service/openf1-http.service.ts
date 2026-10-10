import { inject, Service } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { IRace } from '@f2020/data';
import { GridPosition, Interval, Lap, openF1Url, PitStop, Position, RaceControl, Session, SessionResult, Stint, TeamRadio as OpenF1TeamRadio } from '@f2020/openf1';
import { requiredValue } from '@f2020/tools';
import { DateTime } from 'luxon';
import { catchError, combineLatest, defer, map, Observable, of, shareReplay, tap } from 'rxjs';

// The season is part of the key, as a circuit is raced every year
const sessionKey = (race: IRace, session: 'Race' | 'Qualifying' | 'Sprint') => `${session}-${race.season}-${race.circuitId}`;
const sessionCache = new Map<string, Observable<Session>>();
const toISOOptions = { includeOffset: false, suppressMilliseconds: true };
const openF1ApiUrl = 'https://api.openf1.org/v1/';

@Service()
export class OpenF1HttpService {
  #functions = inject(Functions);

  getSession(race: IRace, sessionName: 'Race' | 'Qualifying' | 'Sprint'): Observable<Session> {
    const key = sessionKey(race, sessionName);
    if (!sessionCache.has(key)) {
      const session = JSON.parse(localStorage.getItem(key)) as Session | null;
      const session$ = session
        ? of(session)
        : this.#getList<Session>(openF1Url.session(race.season, race.circuitId, sessionName)).pipe(
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
    return combineLatest({
      positions: this.#getList<Position>(openF1Url.positions(sessionKey) + positionQuery),
      laps: this.#getList<Lap>(openF1Url.labs(sessionKey) + lapsQuery),
    });
  }

  getPositions(sessionKey: number): Observable<Position[]> {
    return this.#getList<Position>(openF1Url.positions(sessionKey));
  }

  getLaps(sessionKey: number): Observable<Lap[]> {
    return this.#getList<Lap>(openF1Url.labs(sessionKey));
  }

  getSessionResult(sessionKey: number): Observable<SessionResult[]> {
    return this.#getList<SessionResult>(openF1Url.sessionResults(sessionKey));
  }

  getStartingGrid(sessionKey: number): Observable<GridPosition[]> {
    return this.#getList<GridPosition>(openF1Url.startingGrid(sessionKey));
  }

  getTeamRadio(race: IRace, sessionKey: number, positionAfter?: DateTime): Observable<OpenF1TeamRadio[]> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const positionQuery = `&date<=${latestEndTime.toISO(toISOOptions)}` + (positionAfter ? `&date_start>=${positionAfter.toISO(toISOOptions)}` : '');
    return this.#getList<OpenF1TeamRadio>(openF1Url.radio(sessionKey) + positionQuery);
  }

  getPitStops(sessionKey: number) {
    return this.#getList<PitStop>(openF1Url.pitStops(sessionKey));
  }

  getIntervals(sessionKey: number): Observable<Interval[]> {
    return this.#getList<Interval>(openF1Url.intervals(sessionKey));
  }

  getRaceControl(sessionKey: number): Observable<RaceControl[]> {
    return this.#getList<RaceControl>(openF1Url.raceControl(sessionKey));
  }

  getStints(sessionKey: number): Observable<Stint[]> {
    return this.#getList<Stint>(openF1Url.stints(sessionKey));
  }

  /**
   * The lists are fetched by a function, as OpenF1 answers the CORS preflight of a browser with 401 during a live session.
   * The function answers an empty list when OpenF1 has no data
   */
  #getList<T>(url: string): Observable<T[]> {
    return defer(() => httpsCallable<{ path: string; }, T[]>(this.#functions, 'openF1Call')({ path: url.replace(openF1ApiUrl, '') })).pipe(
      map(response => response.data),
    );
  }

  /** The token for the live updates over MQTT */
  getToken(): Observable<string> {
    return defer(() => httpsCallable<void, { token: string; }>(this.#functions, 'getToken')().then(response => response.data.token)).pipe(
      catchError(error => {
        console.error('Failed to fetch OpenF1 token:', error);
        throw new Error('Failed to fetch OpenF1 token');
      }),
    );
  }
}
