import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IDriver, IDriverRaceResult, IPitStop, IRace, IRaceResult, ITeam, mapper, TeamRadio } from '@f2020/data';
import { Lap, PitStop, Position, TeamRadio as OpenF1TeamRadio } from '@f2020/openf1';
import { isTruthy, requiredValue } from '@f2020/tools';
import { DateTime } from 'luxon';
import { BehaviorSubject, combineLatest, Observable, of, scan, switchMap, takeWhile, tap, timer } from 'rxjs';
import { catchError, concatMap, map, retry } from 'rxjs/operators';
import { OpenF1HttpService } from './openf1-http.service';
import { OpenF1WSSService } from './openf1-wss.service';

const mergeLaps = (previousLaps: Lap[], currentLaps: Lap[]) => {
  const lapMap = new Map(previousLaps.map(lap => [`${lap.lap_number}-${lap.driver_number}`, lap]));

  return Array.from(
    currentLaps.reduce((map, lap) =>
      map.set(`${lap.lap_number}-${lap.driver_number}`, lap), lapMap,
    ).values(),
  );
};

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
  #positionStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  readonly resultStatus = this.#resultStatus$.asObservable();
  readonly radioStatus = this.#radioStatus$.asObservable();
  readonly pitStopStatus = this.#pitStopStatus$.asObservable();
  readonly positionStatus = this.#pitStopStatus$.asObservable();

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

  getResult(race: IRace, drivers: IDriver[]): Observable<{ result: IRaceResult, latestUpdate: DateTime; } | null> {
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
        concatMap(sessionKey => combineLatest([
          this.#openF1HttpService.getPositionAndLabs(race, sessionKey),
          combineLatest({
            position: this.#openF1WSSService.positions$,
            lap: this.#openF1WSSService.laps$,
          }),
        ])),
        map(([{ positions, laps }, { position, lap }], index) => ({
          positions: (index === 0 ? [...positions, position] : [position]).filter(isTruthy),
          laps: (index === 0 ? [...laps, lap] : [lap]).filter(isTruthy),
        })),
        catchError(error => {
          this.#resultStatus$.next({ latestUpdate: DateTime.now(), error });
          return of({ positions: [], laps: [] });
        }),
        scan((previous, current) => ({
          positions: [...previous.positions, ...current.positions ?? []],
          laps: mergeLaps(previous.laps, current.laps ?? []),
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

  getRadio(race: IRace, drivers: IDriver[]): Observable<TeamRadio[] | null> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const isLiveLive = DateTime.now().toUTC() < latestEndTime;

    return isLiveLive
      ? this.#openF1HttpService.getSession(race, 'Race').pipe(
        map(session => requiredValue(session.session_key, 'session_key')),
        tap(() => this.#radioStatus$.next({ latestUpdate: DateTime.now(), error: undefined })),
        concatMap(sessionKey => combineLatest([
          this.#openF1HttpService.getTeamRadio(race, sessionKey),
          this.#openF1WSSService.radio$,
        ]).pipe(
          map(([radioMessages, radioUpdate], index) => (index === 0 ? [...radioMessages, radioUpdate] : [radioUpdate]).filter(isTruthy)),
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

  getPitStops(race: IRace, drivers: IDriver[], teams: ITeam[]): Observable<IPitStop[]> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const isLiveLive = DateTime.now().toUTC() < latestEndTime;

    return this.#openF1HttpService.getSession(race, 'Race').pipe(
      map(session => requiredValue(session.session_key, 'session_key')),
      concatMap(sessionKey => {
        return isLiveLive
          ? combineLatest([
            this.#openF1HttpService.getPitStops(sessionKey),
            this.#openF1WSSService.pitStops$,
          ]).pipe(
            map(([pitStops, pitStopUpdate], index) => (index === 0 ? [...pitStops, pitStopUpdate] : [pitStopUpdate]).filter(isTruthy)),
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

  getPositions(race: IRace, drivers: IDriver[]): Observable<IDriverRaceResult[]> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    return this.#openF1HttpService.getSession(race, 'Race').pipe(
      map(session => requiredValue(session.session_key, 'session_key')),
      switchMap(sessionKey => combineLatest([
        this.#openF1HttpService.getPositions(sessionKey),
        this.#openF1WSSService.positions$,
      ]).pipe(
        map(([positions, update], index) => (index === 0 ? [...positions, update] : [update]).filter(isTruthy)),
        catchError(error => {
          console.error(error);
          this.#positionStatus$.next({ error, latestUpdate: DateTime.now() });
          return of<Position[]>([]);
        }),
        scan((previous, current) => [...previous, ...current], []),
        tap(() => this.#positionStatus$.next({ latestUpdate: DateTime.now() })),
        takeWhile(() => DateTime.local() < latestEndTime),
      )),
      map(positions => mapper.position({ positions, race, drivers })),
    );
  }


}
