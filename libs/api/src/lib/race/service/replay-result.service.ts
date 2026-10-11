import { DestroyRef, inject, Service } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IDriver,
  IDriverGridPosition,
  IDriverInterval,
  IDriverLocation,
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
import { Interval, Lap, Location, PitStop, Position, RaceControl as OpenF1RaceControl, Stint, TeamRadio as OpenF1TeamRadio } from '@f2020/openf1';
import { requiredValue, shareLatest, truthy } from '@f2020/tools';
import { DateTime } from 'luxon';
import { BehaviorSubject, catchError, distinctUntilChanged, firstValueFrom, interval, Observable, of } from 'rxjs';
import { first, map, switchMap, tap } from 'rxjs/operators';
import { OpenF1HttpService } from './openf1-http.service';
import { LiveStatus, RaceResultService } from './race-result.service';

interface ReplayState {
  start: DateTime;
  end: DateTime;
  currentTime: DateTime;
  sessionKey: number;
  positions: Position[];
  laps: Lap[];
  teamRadio: OpenF1TeamRadio[];
  pitStops: PitStop[];
  intervals: Interval[];
  raceControl: OpenF1RaceControl[];
  stints: Stint[];
}

/** Where the relive is, and between which times it can be moved */
export interface ReplayClock {
  start: DateTime;
  end: DateTime;
  currentTime: DateTime;
}

export const replaySpeeds = [1, 2, 3] as const;
export type ReplaySpeed = typeof replaySpeeds[number];

/** The relive moves this often, by the time multiplied by the speed */
const tick = 1000;
/** The locations are fetched for this long at a time */
const locationChunk = 30_000;

@Service({ autoProvided: false })
export class ReplayResultService extends RaceResultService {
  #openF1HttpService = inject(OpenF1HttpService);
  #destroyRef = inject(DestroyRef);
  #started = false;
  #speed$ = new BehaviorSubject<ReplaySpeed>(1);

  #resultStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #radioStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #pitStopStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #positionStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #intervalStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #stintStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #raceControlStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #sectorStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #replayState$ = new BehaviorSubject<ReplayState | null>(null);

  readonly resultStatus = this.#resultStatus$.asObservable();
  readonly radioStatus = this.#radioStatus$.asObservable();
  readonly pitStopStatus = this.#pitStopStatus$.asObservable();
  readonly positionStatus = this.#positionStatus$.asObservable();
  readonly intervalStatus = this.#intervalStatus$.asObservable();
  readonly stintStatus = this.#stintStatus$.asObservable();
  readonly raceControlStatus = this.#raceControlStatus$.asObservable();
  readonly sectorStatus = this.#sectorStatus$.asObservable();
  readonly currentLap = new BehaviorSubject<number>(0);
  readonly speed = this.#speed$.asObservable();
  readonly clock: Observable<ReplayClock> = this.#replayState$.pipe(
    truthy(),
    map(({ start, end, currentTime }) => ({ start, end, currentTime })),
  );

  setSpeed(speed: ReplaySpeed) {
    this.#speed$.next(speed);
  }

  /** Moves the relive to a time between the start and the end of the race */
  seek(time: DateTime) {
    const state = this.#replayState$.value;
    state && this.#replayState$.next({ ...state, currentTime: DateTime.min(DateTime.max(time, state.start), state.end) });
  }

  #gridPositions?: Observable<IDriverGridPosition[]>;
  #locations$?: Observable<IDriverLocation[]>;

  /** The race is relived as it was driven, from the start until the session ended */
  async #startReplay(race: IRace) {
    if (this.#started) {
      return;
    }
    this.#started = true;

    // Get session key first
    const session = await firstValueFrom(this.#openF1HttpService.getSession(race, 'Race'));
    const sessionKey = requiredValue(session.session_key, 'session_key');

    // Fetch all data sequentially using await
    const intervals = await firstValueFrom(this.#openF1HttpService.getIntervals(sessionKey));
    const { positions, laps } = await firstValueFrom(this.#openF1HttpService.getPositionAndLabs(race, sessionKey));
    const teamRadio = await firstValueFrom(this.#openF1HttpService.getTeamRadio(race, sessionKey));
    const pitStops = await firstValueFrom(this.#openF1HttpService.getPitStops(sessionKey));
    const raceControl = await firstValueFrom(this.#openF1HttpService.getRaceControl(sessionKey));
    const stints = await firstValueFrom(this.#openF1HttpService.getStints(sessionKey));

    const start = race.raceStart.toUTC();
    const end = session.date_end ? DateTime.fromISO(session.date_end) : start.plus({ hour: 3 });
    this.#replayState$.next({ start, end, currentTime: start, sessionKey, positions, laps, teamRadio, pitStops, intervals, raceControl, stints });

    interval(tick).pipe(
      takeUntilDestroyed(this.#destroyRef),
    ).subscribe(() => {
      const state = this.#replayState$.value;
      state && state.currentTime < state.end && this.seek(state.currentTime.plus({ milliseconds: tick * this.#speed$.value }));
    });
  }

  getResult(race: IRace, drivers: IDriver[]): Observable<{ result: IRaceResult, latestUpdate: DateTime; } | null> {
    this.#startReplay(race);
    const grid$ = this.getGrid(race, drivers);

    return this.#replayState$.pipe(
      truthy(),
      map(state => ({
        positions: state.positions.filter(p => !p.date || DateTime.fromISO(p.date) <= state.currentTime),
        laps: state.laps.filter(l => !l.date_start || DateTime.fromISO(l.date_start) <= state.currentTime),
        currentTime: state.currentTime,
      })),
      switchMap(value => grid$.pipe(
        map(gridPositions => ({ ...value, gridPositions })),
      )),
      map(({ positions, laps, gridPositions, currentTime }) => {
        const { result, ...raceNoResult } = race;
        const latestUpdate = DateTime.fromISO(laps.at(-1)?.date_start ?? currentTime.toISO());
        this.currentLap.next(laps.at(-1)?.lap_number ?? 0);
        // Update the status with current information
        this.#resultStatus$.next({
          latestUpdate: DateTime.now(),
          info: `Lap ${laps.at(-1)?.lap_number ?? 0} - ${laps.length} laps, ${positions.length} positions`,
        });
        return {
          result: mapper.liveRaceResult({ positions, laps, race: raceNoResult, drivers, gridPositions }),
          latestUpdate,
        };
      }),
    );
  }

  getRadio(_race: IRace, drivers: IDriver[]): Observable<TeamRadio[] | null> {
    return this.#replayState$.pipe(
      truthy(),
      map(state => state.teamRadio.filter(m => !m.date || DateTime.fromISO(m.date) <= state.currentTime)),
      map(messages => mapper.radio({ messages, drivers }).toSorted((a, b) => b.date.valueOf() - a.date.valueOf())),
      tap(messages => this.#radioStatus$.next({
        latestUpdate: DateTime.now(),
        info: `${messages.length} messages`,
      })),
    );
  }

  getPitStops(_race: IRace, drivers: IDriver[], teams: ITeam[]): Observable<IPitStop[]> {
    return this.#replayState$.pipe(
      truthy(),
      map(state => state.pitStops.filter(p => !p.date || DateTime.fromISO(p.date) <= state.currentTime)),
      map(pitStops => mapper.pitStops({ pitStops, drivers, teams })),
      tap(mappedStops => this.#pitStopStatus$.next({
        latestUpdate: DateTime.now(),
        info: `${mappedStops.length} pit stops`,
      })),
    );
  }

  getPositions(race: IRace, drivers: IDriver[]): Observable<IDriverRaceResult[]> {
    return this.#replayState$.pipe(
      truthy(),
      switchMap(state => {
        const filteredPositions = state.positions.filter(p => !p.date || DateTime.fromISO(p.date) <= state.currentTime);

        return this.getGrid(race, drivers).pipe(
          map(gridPositions => ({
            positions: filteredPositions,
            gridPositions,
            currentTime: state.currentTime,
          })),
        );
      }),
      tap(({ positions, currentTime }) => {
        const latestUpdate = DateTime.fromISO(positions.at(-1)?.date ?? currentTime.toISO());
        this.#positionStatus$.next({
          latestUpdate,
          info: `${positions.length} position updates`,
        });
      }),
      map(({ positions, gridPositions }) => mapper.position({ positions, race, drivers, gridPositions })),
    );
  }

  getIntervals(_race: IRace, drivers: IDriver[]): Observable<IDriverInterval[]> {
    return this.#replayState$.pipe(
      truthy(),
      map(state => state.intervals.filter(i => !i.date || DateTime.fromISO(i.date) <= state.currentTime)),
      tap(intervals => this.#intervalStatus$.next({
        latestUpdate: DateTime.now(),
        info: `${intervals.length} intervals`,
      })),
      map(intervals => mapper.intervalMapper({ intervals, drivers })),
    );
  }

  getRaceControl(_race: IRace, drivers: IDriver[]): Observable<RaceControl[]> {
    return this.#replayState$.pipe(
      truthy(),
      map(state => state.raceControl.filter(m => !m.date || DateTime.fromISO(m.date) <= state.currentTime)),
      map(messages => mapper.raceControl({ messages, drivers })),
      tap(mappedMessages => this.#raceControlStatus$.next({
        latestUpdate: DateTime.now(),
        info: `${mappedMessages.length} race control messages`,
      })),
    );
  }

  getStints(_race: IRace, drivers: IDriver[]): Observable<IStint[]> {
    return this.#replayState$.pipe(
      truthy(),
      map(state => {
        // Filter laps up to current time
        const currentLaps = state.laps.filter(l => !l.date_start || DateTime.fromISO(l.date_start) <= state.currentTime);

        // Get the maximum lap number that has been completed at current time
        const maxLapNumber = Math.max(0, ...currentLaps.map(l => l.lap_number));

        // Filter stints where the lapStart is less than or equal to the current max lap
        // and if lapEnd exists, the current lap should be within the stint range
        const visibleStints = state.stints.filter(stint =>
          stint.lap_start <= maxLapNumber &&
          (stint.lap_end === 0 || maxLapNumber <= stint.lap_end),
        );

        return mapper.stints({ stints: visibleStints, drivers });
      }),
      tap(mappedStints => this.#stintStatus$.next({
        latestUpdate: DateTime.now(),
        info: `${mappedStints.length} stints`,
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

  /**
   * The locations are fetched 30 seconds at a time, as a whole race has about half a million. Each driver is shown at the latest
   * location before the time of the relive, so moving it back works as well
   */
  getLocations(_race: IRace, drivers: IDriver[]): Observable<IDriverLocation[]> {
    // The track card and the fullscreen share the locations
    this.#locations$ ??= this.#replayState$.pipe(
      truthy(),
      map(({ sessionKey, start, currentTime }) => ({ sessionKey, from: start.plus({ milliseconds: Math.floor(currentTime.diff(start).as('milliseconds') / locationChunk) * locationChunk }) })),
      distinctUntilChanged((a, b) => a.from.equals(b.from)),
      // A little before the chunk, so every car has a location at its start
      switchMap(({ sessionKey, from }) => this.#openF1HttpService.getLocations(sessionKey, from.minus({ seconds: 2 }), from.plus({ milliseconds: locationChunk })).pipe(
        map(locations => locations.map(location => ({ ...location, time: DateTime.fromISO(location.date) }))),
        catchError(error => {
          console.error('Failed to fetch the locations', error);
          return of([]);
        }),
      )),
      switchMap(chunk => this.#replayState$.pipe(
        truthy(),
        map(({ currentTime }) => chunk
          .filter(({ time }) => time <= currentTime)
          .reduce((latest, location) => latest.set(location.driver_number, location), new Map<number, Location>())),
      )),
      map(locations => mapper.locations({ locations: [...locations.values()], drivers })),
      shareLatest(),
    );
    return this.#locations$;
  }

  getSectorStatus(race: IRace, drivers: IDriver[]): Observable<IDriverSector[]> {
    return this.#replayState$.pipe(
      truthy(),
      map(state => state.laps.filter(l => !l.date_start || DateTime.fromISO(l.date_start) <= state.currentTime)),
      tap(sectors => this.#sectorStatus$.next({
        latestUpdate: DateTime.now(),
        info: `${sectors.length} driver sectors`,
      })),
      map(laps => mapper.sectors({ laps, drivers })),
    );
  }
}
