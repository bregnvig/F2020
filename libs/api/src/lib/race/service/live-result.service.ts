import { inject, Injectable } from '@angular/core';
import { IDriver, IPitStop, IRace, IRaceResult, ITeam, mapper, TeamRadio } from '@f2020/data';
import { BehaviorSubject, combineLatest, Observable, of, scan, switchMap, takeWhile, tap, timer } from 'rxjs';
import { DateTime } from 'luxon';
import { catchError, map, retry } from 'rxjs/operators';
import { requiredValue } from '@f2020/tools';
import { PitStop, TeamRadio as OpenF1TeamRadio } from '@f2020/openf1';
import { OpenF1HttpService } from './openf1-http.service';
import { OpenF1WSSService } from './openf1-wss.service';
import { HttpErrorResponse } from '@angular/common/http';

interface LiveStatus {
  error?: HttpErrorResponse;
  latestUpdate: DateTime | null;
}

@Injectable()
export class LiveResultService {
  #openF1HttpService = inject(OpenF1HttpService);
  #openF1WSSService = inject(OpenF1WSSService);

  #resultStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #radioStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #pitStopStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  readonly resultStatus = this.#resultStatus$.asObservable();
  readonly radioStatus = this.#radioStatus$.asObservable();
  readonly pitStopStatus = this.#pitStopStatus$.asObservable();

  #replayResult(race: IRace, drivers: IDriver[]): Observable<{ result: IRaceResult, latestUpdate: DateTime; } | null> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    let date = race.raceStart.toUTC().minus({ hour: 1 });
    return this.#openF1HttpService.getSession(race, 'Race').pipe(
      switchMap(session => this.#openF1HttpService.getPositionAndLabs(race, session.session_key)),
      switchMap(({ positions, laps }) => {
        return timer(0, 500).pipe(
          takeWhile(() => date < latestEndTime),
          map(() => ({
            positions: positions.filter(p => !p.date || DateTime.fromISO(p.date) <= date),
            laps: laps.filter(l => !l.date_start || DateTime.fromISO(l.date_start) <= date),
          })),
          tap(() => date = date.plus({ minute: 5 })),
          map(({ positions, laps }) => {
            const { result, ...raceNoResult } = race;
            return mapper.raceResult({ positions, laps, race: raceNoResult, drivers });
          }),
          map(result => ({ result, latestUpdate: date })),
        );
      }),
    );
  }

  #replayRadio(race: IRace, drivers: IDriver[]): Observable<TeamRadio[] | null> {
    return this.#openF1HttpService.getSession(race, 'Race').pipe(
      switchMap(session => this.#openF1HttpService.getTeamRadio(race, session.session_key)),
      map(messages => mapper.radio({ messages, drivers }).toSorted((a, b) => b.date.valueOf() - a.date.valueOf())),
    );
  }

  #replayPitStops(race: IRace) {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    let replaceDate: DateTime = race.raceStart.toUTC().minus({ hour: 1 });

    return this.#openF1HttpService.getSession(race, 'Race').pipe(
      map(session => requiredValue(session.session_key, 'session_key')),
      switchMap(sessionKey => this.#openF1HttpService.getPitStops(sessionKey)),
      switchMap(pitStops => {
        return timer(0, 500).pipe(
          takeWhile(() => replaceDate < latestEndTime),
          map(() => pitStops.filter(p => !p.date || DateTime.fromISO(p.date) <= replaceDate)),
          tap(() => replaceDate = replaceDate.plus({ minute: 5 })),
        );
      }));
  }

  getLiveResult(race: IRace, drivers: IDriver[]): Observable<{ result: IRaceResult, latestUpdate: DateTime; } | null> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const isLiveLive = DateTime.now().toUTC() < latestEndTime;
    return isLiveLive
      ? this.#openF1HttpService.getSession(race, 'Race').pipe(
        retry({
          count: 3,
          delay: 5000,
        }),
        map(session => requiredValue(session.session_key, 'session_key')),
        // takeWhile(() => DateTime.local() < latestEndTime),
        switchMap(sessionKey => combineLatest([
          this.#openF1HttpService.getPositionAndLabs(race, sessionKey),
          combineLatest({
            positions: this.#openF1WSSService.positions$,
            laps: this.#openF1WSSService.laps$,
          }),
        ])),
        map(([{ positions, laps }, { positions: positionUpdates, laps: lapUpdates }], index) => ({
          positions: index === 0 ? [...positions, ...positionUpdates] : positionUpdates,
          laps: index === 0 ? [...laps, ...lapUpdates] : lapUpdates,
        })),
        catchError(error => {
          this.#resultStatus$.next({ latestUpdate: DateTime.now(), error });
          return of({ positions: [], laps: [] });
        }),
        scan((previous, current) => ({
          positions: [...previous.positions, ...current.positions ?? []],
          laps: [...previous.laps, ...current.laps ?? []],
        })),
        map(value => {
          const { result, ...raceNoResult } = race;
          const raceResult = mapper.raceResult({ positions: value.positions, laps: value.laps, race: raceNoResult, drivers });
          return ({ result: raceResult, latestUpdate: DateTime.now(), error: value['error'] });
        }),
        tap(() => this.#resultStatus$.next({ latestUpdate: DateTime.now() })),
      )
      : this.#replayResult(race, drivers);
  }

  getLiveRadio(race: IRace, drivers: IDriver[]): Observable<TeamRadio[] | null> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const isLiveLive = DateTime.now().toUTC() < latestEndTime;

    return isLiveLive
      ? this.#openF1HttpService.getSession(race, 'Race').pipe(
        map(session => requiredValue(session.session_key, 'session_key')),
        tap(() => this.#radioStatus$.next({ latestUpdate: DateTime.now(), error: undefined })),
        switchMap(sessionKey => combineLatest([
          this.#openF1HttpService.getTeamRadio(race, sessionKey),
          this.#openF1WSSService.radio$,
        ]).pipe(
          map(([radioMessages, radioUpdates], index) => index === 0 ? [...radioMessages, ...radioUpdates] : radioUpdates),
          catchError(error => {
            this.#radioStatus$.next({ latestUpdate: DateTime.now(), error });
            return of<OpenF1TeamRadio[]>([]);
          }),
        )),
        takeWhile(() => DateTime.local() < latestEndTime),
        map(messages => mapper.radio({ messages, drivers })),
        scan((previous, current) => [...previous, ...current]),
        map(messages => messages.toSorted((a, b) => b.date.valueOf() - a.date.valueOf())),
        tap(() => this.#radioStatus$.next({ latestUpdate: DateTime.now() })),
      )
      : this.#replayRadio(race, drivers);
  }

  getLivePitStops(race: IRace, drivers: IDriver[], teams: ITeam[]): Observable<IPitStop[]> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const isLiveLive = DateTime.now().toUTC() < latestEndTime;

    return this.#openF1HttpService.getSession(race, 'Race').pipe(
      map(session => requiredValue(session.session_key, 'session_key')),
      switchMap(sessionKey => {
        return isLiveLive
          ? combineLatest([
            this.#openF1HttpService.getPitStops(sessionKey),
            this.#openF1WSSService.pitStops$,
          ]).pipe(
            map(([pitStops, pitStopUpdates], index) => index === 0 ? [...pitStops, ...pitStopUpdates] : pitStopUpdates),
            catchError(error => {
              console.error(error);
              this.#pitStopStatus$.next({ error, latestUpdate: DateTime.now() });
              return of<PitStop[]>([]);
            }),
            scan((previous, current) => [...previous, ...current], []),
            tap(() => this.#pitStopStatus$.next({ latestUpdate: DateTime.now() })),
            takeWhile(() => DateTime.local() < latestEndTime),
          )
          : this.#replayPitStops(race);
      }),
      map(pitStops => mapper.pitStops({ pitStops, drivers, teams })),
    );
  }


}
