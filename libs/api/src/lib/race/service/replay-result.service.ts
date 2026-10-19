import { DestroyRef, inject, Service } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IDriver,
  IDriverGridPosition,
  IDriverInterval,
  IDriverRaceResult,
  IDriverSector,
  IFastestLaps,
  IPitStop,
  IRace,
  IRaceResult,
  IStint,
  ITeam,
  IWeatherReading,
  LocationPlayback,
  mapper,
  RaceControl,
  TeamRadio,
} from '@f2020/data';
import { Interval, Lap, Location, PitStop, Position, RaceControl as OpenF1RaceControl, Stint, TeamRadio as OpenF1TeamRadio, Weather } from '@f2020/openf1';
import { requiredValue, shareLatest, truthy } from '@f2020/tools';
import { DateTime } from 'luxon';
import { BehaviorSubject, catchError, distinctUntilChanged, firstValueFrom, interval, Observable, of, retry, timer } from 'rxjs';
import { first, map, switchMap, tap } from 'rxjs/operators';
import { addLocationSamples } from './live-utils';
import { OpenF1HttpService } from './openf1-http.service';
import { LiveStatus, RaceResultService } from './race-result.service';

/** Items in the order of their times in milliseconds. Items without a time come first */
interface Timed<T> {
  items: T[];
  times: number[];
}

const timed = <T>(items: T[], date: (item: T) => string | null | undefined): Timed<T> => {
  const sorted = items
    .map(item => ({ item, time: date(item) ? Date.parse(date(item)!) : Number.NEGATIVE_INFINITY }))
    .toSorted((a, b) => a.time - b.time);
  return { items: sorted.map(({ item }) => item), times: sorted.map(({ time }) => time) };
};

/**
 * The items up to a time. A race has about 25.000 items, so they are found by halving instead of parsing every date
 * every second, which made the relive stall
 */
const upTo = <T>({ items, times }: Timed<T>, time: DateTime): T[] => {
  const milliseconds = time.toMillis();
  let [low, high] = [0, times.length];
  while (low < high) {
    const middle = (low + high) >> 1;
    times[middle] <= milliseconds ? low = middle + 1 : high = middle;
  }
  return items.slice(0, low);
};

interface ReplayState {
  start: DateTime;
  end: DateTime;
  currentTime: DateTime;
  sessionKey: number;
  positions: Timed<Position>;
  laps: Timed<Lap>;
  teamRadio: Timed<OpenF1TeamRadio>;
  pitStops: Timed<PitStop>;
  intervals: Timed<Interval>;
  raceControl: Timed<OpenF1RaceControl>;
  stints: Stint[];
  weather: Timed<Weather>;
}

/** Where the relive is, and between which times it can be moved */
export interface ReplayClock {
  start: DateTime;
  end: DateTime;
  currentTime: DateTime;
}

export const replaySpeeds = [1, 2, 3, 5] as const;
export type ReplaySpeed = typeof replaySpeeds[number];

/** The relive starts this long before the lights go out, as the pit exit opens long before */
const beforeLightsOut = 15_000;

/** The first lap of every driver starts when the lights go out, which can be long after the scheduled start */
const lightsOut = (laps: Lap[]): DateTime | undefined => {
  const start = laps.find(lap => lap.lap_number === 1 && lap.date_start)?.date_start;
  return start ? DateTime.fromISO(start) : undefined;
};

/** A request for the relive is tried again a little later each time */
const startRetry = { count: 4, delay: (_error: unknown, attempt: number) => timer(2000 * attempt) };

/** The relive moves this often, by the time multiplied by the speed */
const tick = 1000;
/** The locations are fetched for this long at a time */
const locationChunk = 30_000;
/** The next locations are fetched this long before they are needed, which is 4 seconds at 5x */
const locationLookahead = 20_000;

@Service({ autoProvided: false })
export class ReplayResultService extends RaceResultService {
  #openF1HttpService = inject(OpenF1HttpService);
  #destroyRef = inject(DestroyRef);
  #started = false;
  #speed$ = new BehaviorSubject<ReplaySpeed>(1);
  /** When the relive last moved, so the cars can be drawn between the moves */
  #movedAt = 0;

  #resultStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #radioStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #pitStopStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #positionStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #intervalStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #stintStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #raceControlStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #sectorStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #locationStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #weatherStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #replayState$ = new BehaviorSubject<ReplayState | null>(null);

  readonly resultStatus = this.#resultStatus$.asObservable();
  readonly radioStatus = this.#radioStatus$.asObservable();
  readonly pitStopStatus = this.#pitStopStatus$.asObservable();
  readonly positionStatus = this.#positionStatus$.asObservable();
  readonly intervalStatus = this.#intervalStatus$.asObservable();
  readonly stintStatus = this.#stintStatus$.asObservable();
  readonly raceControlStatus = this.#raceControlStatus$.asObservable();
  readonly sectorStatus = this.#sectorStatus$.asObservable();
  readonly locationStatus = this.#locationStatus$.asObservable();
  readonly weatherStatus = this.#weatherStatus$.asObservable();
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
    this.#movedAt = performance.now();
    state && this.#replayState$.next({ ...state, currentTime: DateTime.min(DateTime.max(time, state.start), state.end) });
  }

  /** The time of the relive right now, which is between two moves */
  #now = () => {
    const state = this.#replayState$.value;
    if (!state) return 0;
    const time = state.currentTime.toMillis();
    return state.currentTime < state.end ? time + Math.min(performance.now() - this.#movedAt, tick) * this.#speed$.value : time;
  };

  #gridPositions?: Observable<IDriverGridPosition[]>;
  #locationPlayback$?: Observable<LocationPlayback>;

  /** The race is relived as it was driven, from just before the lights go out until the session ended */
  async #startReplay(race: IRace) {
    if (this.#started) {
      return;
    }
    this.#started = true;

    // Get session key first
    const session = await firstValueFrom(this.#openF1HttpService.getSession(race, 'Race').pipe(retry(startRetry)));
    const sessionKey = requiredValue(session.session_key, 'session_key');

    // Fetch all data sequentially using await. OpenF1 may refuse a request when too many are made, so each is tried again
    const intervals = await firstValueFrom(this.#openF1HttpService.getIntervals(sessionKey).pipe(retry(startRetry)));
    const { positions, laps } = await firstValueFrom(this.#openF1HttpService.getPositionAndLabs(race, sessionKey).pipe(retry(startRetry)));
    const teamRadio = await firstValueFrom(this.#openF1HttpService.getTeamRadio(race, sessionKey).pipe(retry(startRetry)));
    const pitStops = await firstValueFrom(this.#openF1HttpService.getPitStops(sessionKey).pipe(retry(startRetry)));
    const raceControl = await firstValueFrom(this.#openF1HttpService.getRaceControl(sessionKey).pipe(retry(startRetry)));
    const stints = await firstValueFrom(this.#openF1HttpService.getStints(sessionKey).pipe(retry(startRetry)));
    const weather = await firstValueFrom(this.#openF1HttpService.getWeather(sessionKey).pipe(retry(startRetry)));

    const start = lightsOut(laps)?.minus({ milliseconds: beforeLightsOut }) ?? race.raceStart.toUTC();
    const end = session.date_end ? DateTime.fromISO(session.date_end) : start.plus({ hour: 3 });
    this.#replayState$.next({
      start,
      end,
      currentTime: start,
      sessionKey,
      positions: timed(positions, p => p.date),
      laps: timed(laps, l => l.date_start),
      teamRadio: timed(teamRadio, m => m.date),
      pitStops: timed(pitStops, p => p.date),
      intervals: timed(intervals, i => i.date),
      raceControl: timed(raceControl, m => m.date),
      stints,
      weather: timed(weather, w => w.date),
    });

    interval(tick).pipe(
      takeUntilDestroyed(this.#destroyRef),
    ).subscribe(() => {
      const state = this.#replayState$.value;
      state && state.currentTime < state.end && this.seek(state.currentTime.plus({ milliseconds: tick * this.#speed$.value }));
    });
  }

  getResult(race: IRace, drivers: IDriver[]): Observable<{ result: IRaceResult, latestUpdate: DateTime; } | null> {
    // A start that fails after the retries is shown on the page
    this.#startReplay(race).catch(error => {
      console.error('Failed to start the relive', error);
      this.#started = false;
      this.#resultStatus$.next({ latestUpdate: DateTime.now(), error });
    });
    const grid$ = this.getGrid(race, drivers);

    return this.#replayState$.pipe(
      truthy(),
      map(state => ({
        positions: upTo(state.positions, state.currentTime),
        laps: upTo(state.laps, state.currentTime),
        currentTime: state.currentTime,
      })),
      switchMap(value => grid$.pipe(
        map(gridPositions => ({ ...value, gridPositions })),
      )),
      map(({ positions, laps, gridPositions, currentTime }) => {
        const { result, ...raceNoResult } = race;
        const latestUpdate = DateTime.fromISO(laps.at(-1)?.date_start ?? currentTime.toISO());
        // The laps are not in order of their numbers, so a back marker's lap can come last
        this.currentLap.next(laps.reduce((max, lap) => Math.max(max, lap.lap_number), 0));
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
      map(state => upTo(state.teamRadio, state.currentTime)),
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
      map(state => upTo(state.pitStops, state.currentTime)),
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
        const filteredPositions = upTo(state.positions, state.currentTime);

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
      map(state => upTo(state.intervals, state.currentTime)),
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
      map(state => upTo(state.raceControl, state.currentTime)),
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
        const currentLaps = upTo(state.laps, state.currentTime);

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

  getStrategy(_race: IRace, drivers: IDriver[]): Observable<IStint[]> {
    return this.#replayState$.pipe(
      truthy(),
      map(state => {
        const currentLap = upTo(state.laps, state.currentTime).reduce((max, lap) => Math.max(max, lap.lap_number), 0);
        return mapper.strategy({ stints: state.stints, drivers, currentLap });
      }),
    );
  }

  getFastestLaps(_race: IRace, drivers: IDriver[]): Observable<IFastestLaps> {
    return this.#replayState$.pipe(
      truthy(),
      map(state => {
        const now = state.currentTime.toMillis();
        // A lap is known from its start, so it is only counted once it has been driven
        const laps = upTo(state.laps, state.currentTime).filter(lap => Date.parse(lap.date_start) + (lap.lap_duration ?? 0) * 1000 <= now);
        return mapper.fastestLaps({ laps, drivers });
      }),
    );
  }

  getWeather(_race: IRace): Observable<IWeatherReading[]> {
    return this.#replayState$.pipe(
      truthy(),
      map(state => upTo(state.weather, state.currentTime)),
      // The relive moves every second, and the weather about once a minute
      distinctUntilChanged((previous, current) => previous.length === current.length),
      map(weather => mapper.weather({ weather })),
      tap(readings => this.#weatherStatus$.next({
        latestUpdate: DateTime.now(),
        info: `${readings.length} readings`,
      })),
    );
  }

  getGrid(race: IRace, drivers: IDriver[]): Observable<IDriverGridPosition[]> {
    if (!this.#gridPositions) {
      this.#gridPositions = this.#openF1HttpService.getSession(race, 'Qualifying').pipe(
        switchMap(session => this.#openF1HttpService.getStartingGrid(session.session_key)),
        retry(startRetry),
        map(positions => mapper.grid({ positions, drivers })),
        first(),
        shareLatest(),
      );
    }
    return this.#gridPositions;
  }

  /** The locations are fetched 30 seconds at a time, as a whole race has about half a million */
  getLocationPlayback(_race: IRace, drivers: IDriver[]): Observable<LocationPlayback> {
    // The track card and the fullscreen share the locations
    this.#locationPlayback$ ??= this.#replayState$.pipe(
      truthy(),
      map(({ sessionKey, start, currentTime }) => {
        const chunk = Math.floor((currentTime.diff(start).as('milliseconds') + locationLookahead) / locationChunk);
        return { sessionKey, from: start.plus({ milliseconds: chunk * locationChunk }) };
      }),
      distinctUntilChanged((a, b) => a.from.equals(b.from)),
      // The chunk starts early, as it is fetched before it is needed
      switchMap(({ sessionKey, from }) => this.#openF1HttpService.getLocations(sessionKey, from.minus({ milliseconds: locationLookahead + 2000 }), from.plus({ milliseconds: locationChunk })).pipe(
        retry(startRetry),
        tap(locations => this.#locationStatus$.next({ latestUpdate: DateTime.now(), info: `${locations.length} locations from ${from.toFormat('HH:mm:ss')}` })),
        catchError(error => {
          console.error('Failed to fetch the locations', error);
          this.#locationStatus$.next({ latestUpdate: DateTime.now(), error });
          return of<Location[]>([]);
        }),
      )),
      map(locations => ({ drivers: mapper.locations({ samples: addLocationSamples(new Map(), locations), drivers }), now: this.#now })),
      shareLatest(),
    );
    return this.#locationPlayback$;
  }

  getSectorStatus(race: IRace, drivers: IDriver[]): Observable<IDriverSector[]> {
    return this.#replayState$.pipe(
      truthy(),
      map(state => ({ laps: upTo(state.laps, state.currentTime), now: state.currentTime.toMillis() })),
      tap(({ laps }) => this.#sectorStatus$.next({
        latestUpdate: DateTime.now(),
        info: `${laps.length} driver sectors`,
      })),
      map(({ laps, now }) => mapper.sectors({ laps, drivers, now })),
    );
  }
}
