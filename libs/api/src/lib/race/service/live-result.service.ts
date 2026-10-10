import { inject, Service } from '@angular/core';
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
import { Interval, Lap, RaceControl as OpenF1RaceControl, PitStop, Position, Stint } from '@f2020/openf1';
import { isTruthy, requiredValue, shareLatest } from '@f2020/tools';
import { DateTime } from 'luxon';
import { BehaviorSubject, combineLatest, Observable, of, scan, switchMap, takeWhile, tap } from 'rxjs';
import { catchError, concatMap, first, map, retry } from 'rxjs/operators';
import { OpenF1HttpService } from './openf1-http.service';
import { OpenF1WSSService } from './openf1-wss.service';
import { historyRetry, latestByDriver, mergeLaps, withLiveUpdates } from './live-utils';
import { LiveStatus, RaceResultService } from './race-result.service';

interface LapsAndPositions {
  positions: Position[];
  laps: Lap[];
}

@Service({ autoProvided: false })
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

    return this.#raceSessionKey(race).pipe(
      tap(() => this.#radioStatus$.next({ latestUpdate: DateTime.now(), error: undefined })),
      concatMap(sessionKey => withLiveUpdates(
        this.#openF1HttpService.getTeamRadio(race, sessionKey),
        this.#openF1WSSService.radio$,
        this.#radioStatus$,
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

    return this.#raceSessionKey(race).pipe(
      concatMap(sessionKey => withLiveUpdates(
        this.#openF1HttpService.getPitStops(sessionKey),
        this.#openF1WSSService.pitStops$,
        this.#pitStopStatus$,
      ).pipe(
        scan((previous, current) => [...previous, ...current], [] as PitStop[]),
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

    return this.#raceSessionKey(race).pipe(
      switchMap(sessionKey => withLiveUpdates(
        this.#openF1HttpService.getPositions(sessionKey),
        this.#openF1WSSService.positions$,
        this.#positionStatus$,
      ).pipe(
        scan(latestByDriver<Position>(), new Map<number, Position>()),
        map(positions => [...positions.values()]),
        switchMap(positions => this.getGrid(race, drivers).pipe(
          map(gridPositions => ({ positions, gridPositions })),
        )),
        tap(({ positions }) => this.#positionStatus$.next({
          latestUpdate: DateTime.now(),
          info: `${positions.length} drivers`,
        })),
        takeWhile(() => DateTime.local() < latestEndTime),
      )),
      map(({ positions, gridPositions }) => mapper.position({ positions, race, drivers, gridPositions })),
    );
  }

  getIntervals(race: IRace, drivers: IDriver[]): Observable<IDriverInterval[]> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });

    return this.#raceSessionKey(race).pipe(
      switchMap(sessionKey => withLiveUpdates(
        this.#openF1HttpService.getIntervals(sessionKey),
        this.#openF1WSSService.intervals$,
        this.#intervalStatus$,
      ).pipe(
        scan(latestByDriver<Interval>(), new Map<number, Interval>()),
        map(intervals => [...intervals.values()]),
        tap(intervals => this.#intervalStatus$.next({
          latestUpdate: DateTime.now(),
          info: `${intervals.length} drivers`,
        })),
        takeWhile(() => DateTime.local() < latestEndTime),
      )),
      map(intervals => mapper.intervalMapper({ intervals, drivers })),
    );
  }

  getRaceControl(race: IRace, drivers: IDriver[]): Observable<RaceControl[]> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });

    return this.#raceSessionKey(race).pipe(
      switchMap(sessionKey => withLiveUpdates(
        this.#openF1HttpService.getRaceControl(sessionKey),
        this.#openF1WSSService.raceControl$,
        this.#raceControlStatus$,
      ).pipe(
        scan((previous, current) => [...previous, ...current], [] as OpenF1RaceControl[]),
        takeWhile(() => DateTime.local() < latestEndTime),
      )),
      map(messages => mapper.raceControl({ messages, drivers })),
      tap(mappedMessages => this.#raceControlStatus$.next({
        latestUpdate: DateTime.now(),
        info: `${mappedMessages.length} race control messages`,
      })),
    );
  }

  getStints(race: IRace, drivers: IDriver[]): Observable<IStint[]> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });

    return this.#raceSessionKey(race).pipe(
      concatMap(sessionKey => withLiveUpdates(
        this.#openF1HttpService.getStints(sessionKey),
        this.#openF1WSSService.stints$,
        this.#stintStatus$,
      ).pipe(
        // An update of an earlier stint must not replace the current one
        scan(latestByDriver<Stint>((current, previous) => current.stint_number >= previous.stint_number), new Map<number, Stint>()),
        map(stints => mapper.stints({ stints: [...stints.values()], drivers })),
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

  #raceSessionKey(race: IRace): Observable<number> {
    return this.#openF1HttpService.getSession(race, 'Race').pipe(
      retry(historyRetry),
      map(session => requiredValue(session.session_key, 'session_key')),
    );
  }

  #getLapsAndPositions(race: IRace): Observable<LapsAndPositions> {
    if (!this.#lapsAndPositions$) {
      this.#openF1WSSService.initializeClient();
      this.#lapsAndPositions$ = this.#raceSessionKey(race).pipe(
        // takeWhile(() => DateTime.local() < latestEndTime),
        concatMap(sessionKey => combineLatest([
          this.#openF1HttpService.getPositionAndLabs(race, sessionKey).pipe(
            retry(historyRetry),
            catchError(error => {
              this.#resultStatus$.next({ latestUpdate: DateTime.now(), error });
              return of<LapsAndPositions>({ positions: [], laps: [] });
            }),
          ),
          combineLatest({
            position: this.#openF1WSSService.positions$,
            lap: this.#openF1WSSService.laps$,
          }),
        ])),
        map(([{ positions, laps }, { position, lap }], index) => ({
          positions: (index === 0 ? [...positions, position] : [position]).filter(isTruthy),
          laps: (index === 0 ? [...laps, lap] : [lap]).filter(isTruthy),
        })),
        scan((previous, current) => ({
          positions: [...previous.positions, ...current.positions],
          laps: mergeLaps(previous.laps, current.laps),
        })),
        // The laps are in the order they arrived, so a back marker's lap can come last
        tap(({ laps }) => this.currentLap.next(laps.reduce((max, lap) => Math.max(max, lap.lap_number), 0))),
        shareLatest(),
      );
    }
    return this.#lapsAndPositions$;
  }

}
