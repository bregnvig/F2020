import { inject, Injectable } from '@angular/core';
import {
  IDriver,
  IDriverGridPosition,
  IDriverInterval,
  IDriverRaceResult,
  IDriverSector,
  IPitStop,
  IRace,
  IRaceResult,
  IStint,
  ITeam,
  mapper,
  RaceControl,
  TeamRadio,
} from '@f2020/data';
import { Interval, Lap, RaceControl as OpenF1RaceControl, TeamRadio as OpenF1TeamRadio, PitStop, Position, Stint } from '@f2020/openf1';
import { isTruthy, requiredValue, shareLatest } from '@f2020/tools';
import { DateTime } from 'luxon';
import { BehaviorSubject, combineLatest, Observable, of, scan, switchMap, takeWhile, tap } from 'rxjs';
import { catchError, concatMap, first, map, retry } from 'rxjs/operators';
import { OpenF1HttpService } from './openf1-http.service';
import { OpenF1WSSService } from './openf1-wss.service';
import { LiveStatus, RaceResultService } from './race-result.service';

interface LapsAndPositions {
  positions: Position[];
  laps: Lap[];
}

const mergeLaps = (previousLaps: Lap[], currentLaps: Lap[]) => {
  const lapMap = new Map(previousLaps.map(lap => [`${lap.lap_number}-${lap.driver_number}`, lap]));

  return Array.from(
    currentLaps.reduce((map, lap) =>
      map.set(`${lap.lap_number}-${lap.driver_number}`, lap), lapMap,
    ).values(),
  );
};

@Injectable()
export class LiveResultService extends RaceResultService {
  #openF1HttpService = inject(OpenF1HttpService);
  #openF1WSSService = inject(OpenF1WSSService);

  #resultStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #radioStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #pitStopStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #positionStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #intervalStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #stintStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #raceControlStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #sectorStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  readonly resultStatus = this.#resultStatus$.asObservable();
  readonly radioStatus = this.#radioStatus$.asObservable();
  readonly pitStopStatus = this.#pitStopStatus$.asObservable();
  readonly positionStatus = this.#positionStatus$.asObservable();
  readonly intervalStatus = this.#intervalStatus$.asObservable();
  readonly stintStatus = this.#stintStatus$.asObservable();
  readonly raceControlStatus = this.#raceControlStatus$.asObservable();
  readonly sectorStatus = this.#sectorStatus$.asObservable();
  readonly currentLap = new BehaviorSubject<number>(0);

  #gridPositions?: Observable<IDriverGridPosition[]>;
  #lapsAndPositions$: Observable<LapsAndPositions>;

  getResult(race: IRace, drivers: IDriver[]): Observable<{ result: IRaceResult, latestUpdate: DateTime; } | null> {
    const grid$ = this.getGrid(race, drivers);
    return this.#getLapsAndPositions(race).pipe(
      switchMap(value => grid$.pipe(
        map(gridPositions => ({ ...value, gridPositions, error: value['error'] })),
      )),
      map(({ positions, laps, gridPositions, error }) => {
        const { result, ...raceNoResult } = race;
        const raceResult = mapper.liveRaceResult({ positions, laps, race: raceNoResult, drivers, gridPositions });
        const latestUpdate = DateTime.now();
        // Update the status with current information
        this.#resultStatus$.next({
          latestUpdate,
          info: `${laps.length} laps, ${positions.length} positions`,
        });
        return ({ result: raceResult, latestUpdate, error });
      }),
    );
  }

  getRadio(race: IRace, drivers: IDriver[]): Observable<TeamRadio[] | null> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });

    return this.#openF1HttpService.getSession(race, 'Race').pipe(
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
      tap(messages => this.#radioStatus$.next({
        latestUpdate: DateTime.now(),
        info: `${messages.length} messages`,
      })),
    );
  }

  getPitStops(race: IRace, drivers: IDriver[], teams: ITeam[]): Observable<IPitStop[]> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });

    return this.#openF1HttpService.getSession(race, 'Race').pipe(
      map(session => requiredValue(session.session_key, 'session_key')),
      concatMap(sessionKey => combineLatest([
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
        map(pitStops => mapper.pitStops({ pitStops, drivers, teams })),
        tap(mappedStops => this.#pitStopStatus$.next({
          latestUpdate: DateTime.now(),
          info: `${mappedStops.length} pit stops`,
        })),
        takeWhile(() => DateTime.local() < latestEndTime),
      )));
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
        switchMap(positions => this.getGrid(race, drivers).pipe(
          map(gridPositions => ({ positions, gridPositions })),
        )),
        tap(({ positions }) => this.#positionStatus$.next({
          latestUpdate: DateTime.now(),
          info: `${positions.length} position updates`,
        })),
        takeWhile(() => DateTime.local() < latestEndTime),
      )),
      map(({ positions, gridPositions }) => mapper.position({ positions, race, drivers, gridPositions })),
    );
  }

  getIntervals(race: IRace, drivers: IDriver[]): Observable<IDriverInterval[]> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });

    return this.#openF1HttpService.getSession(race, 'Race').pipe(
      map(session => requiredValue(session.session_key, 'session_key')),
      switchMap(sessionKey => combineLatest([
        this.#openF1HttpService.getIntervals(sessionKey),
        this.#openF1WSSService.intervals$,
      ]).pipe(
        map(([intervals, update], index) => (index === 0 ? [...intervals, update] : [update]).filter(isTruthy)),
        catchError(error => {
          console.error(error);
          this.#intervalStatus$.next({ error, latestUpdate: DateTime.now() });
          return of<Interval[]>([]);
        }),
        scan((previous, current) => [...previous, ...current], []),
        tap(intervals => this.#intervalStatus$.next({
          latestUpdate: DateTime.now(),
          info: `${intervals.length} interval updates`,
        })),
        takeWhile(() => DateTime.local() < latestEndTime),
      )),
      map(intervals => mapper.intervalMapper({ intervals, drivers })),
    );
  }

  getRaceControl(race: IRace, drivers: IDriver[]): Observable<RaceControl[]> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });

    return this.#openF1HttpService.getSession(race, 'Race').pipe(
      map(session => requiredValue(session.session_key, 'session_key')),
      switchMap(sessionKey => combineLatest([
        this.#openF1HttpService.getRaceControl(sessionKey),
        this.#openF1WSSService.raceControl$,
      ]).pipe(
        map(([messages, update], index) => (index === 0 ? [...messages, update] : [update]).filter(isTruthy)),
        catchError(error => {
          console.error(error);
          return of<OpenF1RaceControl[]>([]);
        }),
        scan((previous, current) => [...previous, ...current], []),
        takeWhile(() => DateTime.local() < latestEndTime),
      )),
      map(messages => mapper.raceControl({ messages, drivers })),
      tap(mappedMessages => this.#raceControlStatus$.next({
        latestUpdate: DateTime.now(),
        info: `${mappedMessages.length} race control messages`
      })),
    );
  }

  getStints(race: IRace, drivers: IDriver[]): Observable<IStint[]> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });

    return this.#openF1HttpService.getSession(race, 'Race').pipe(
      map(session => requiredValue(session.session_key, 'session_key')),
      concatMap(sessionKey => combineLatest([
        this.#openF1HttpService.getStints(sessionKey),
        this.#openF1WSSService.stints$,
      ]).pipe(
        map(([stints, stintUpdate], index) => (index === 0 ? [...stints, stintUpdate] : [stintUpdate]).filter(isTruthy)),
        catchError(error => {
          console.error(error);
          return of<Stint[]>([]);
        }),
        scan((previous, current) => [...previous, ...current], []),
        map(stints => mapper.stints({ stints, drivers })),
        tap(mappedStints => this.#stintStatus$.next({
          latestUpdate: DateTime.now(),
          info: `${mappedStints.length} stints`,
        })),
        takeWhile(() => DateTime.local() < latestEndTime),
      )));
  }

  getSectorStatus(race: IRace, drivers: IDriver[]): Observable<IDriverSector[]> {
    return this.#getLapsAndPositions(race).pipe(
      map(({ laps }) => mapper.sectors({ laps, drivers })),
      tap(sectors => this.#sectorStatus$.next({
        latestUpdate: DateTime.now(),
        info: `${sectors.length} driver sectors`,
      })),
    );
  }

  getGrid(race: IRace, drivers: IDriver[]): Observable<IDriverGridPosition[]> {
    if (!this.#gridPositions) {
      this.#gridPositions = this.#openF1HttpService.getSession(race, 'Qualifying').pipe(
        switchMap(session => this.#openF1HttpService.getStartingGrid(session.session_key)),
        map(positions => mapper.grid({ positions, drivers })),
        first(),
        shareLatest(),
      );
    }
    return this.#gridPositions;
  }

  #getLapsAndPositions(race: IRace): Observable<LapsAndPositions> {
    if (!this.#lapsAndPositions$) {
      this.#openF1WSSService.initializeClient();
      this.#lapsAndPositions$ = this.#openF1HttpService.getSession(race, 'Race').pipe(
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
          return of({ positions: [], laps: [] as Lap[] });
        }),
        scan((previous, current) => ({
          positions: [...previous.positions, ...current.positions ?? []],
          laps: mergeLaps(previous.laps, current.laps ?? []),
        })),
        tap(({ laps }) => this.currentLap.next(laps.at(-1)?.lap_number ?? 0)),
        shareLatest(),
      );
    }
    return this.#lapsAndPositions$;
  }

}
