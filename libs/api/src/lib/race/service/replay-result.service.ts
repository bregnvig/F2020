import { inject, Injectable } from '@angular/core';
import { IDriver, IDriverGridPosition, IDriverInterval, IDriverRaceResult, IPitStop, IRace, IRaceResult, IStint, ITeam, mapper, RaceControl, TeamRadio } from '@f2020/data';
import { Interval, Lap, PitStop, Position, RaceControl as OpenF1RaceControl, Stint, TeamRadio as OpenF1TeamRadio } from '@f2020/openf1';
import { requiredValue, shareLatest, truthy } from '@f2020/tools';
import { DateTime } from 'luxon';
import { BehaviorSubject, firstValueFrom, Observable, take, timer } from 'rxjs';
import { first, map, switchMap, tap } from 'rxjs/operators';
import { OpenF1HttpService } from './openf1-http.service';
import { LiveStatus, RaceResultService } from './race-result.service';

interface ReplayState {
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

@Injectable()
export class ReplayResultService extends RaceResultService {
  #openF1HttpService = inject(OpenF1HttpService);

  #resultStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #radioStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #pitStopStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #positionStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #intervalStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #replayState$ = new BehaviorSubject<ReplayState | null>(null);
  
  readonly resultStatus = this.#resultStatus$.asObservable();
  readonly radioStatus = this.#radioStatus$.asObservable();
  readonly pitStopStatus = this.#pitStopStatus$.asObservable();
  readonly positionStatus = this.#positionStatus$.asObservable();
  readonly currentLap = new BehaviorSubject<number>(0);

  #gridPositions?: Observable<IDriverGridPosition[]>;

  async #startReplay(race: IRace, targetDuration = 60000) {
    if (this.#replayState$.value) {
      return;
    }
    
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

    const raceStartTime = race.raceStart.toUTC();
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const totalSteps = targetDuration / 500;
    const timeStepMs = latestEndTime.diff(raceStartTime).as('milliseconds') / totalSteps;

    let currentTime = raceStartTime;
    timer(0, 500).pipe(
      take(totalSteps),
      map(() => {
        const state = { currentTime };
        currentTime = currentTime.plus({ milliseconds: timeStepMs });
        return {
          ...state,
          sessionKey,
          positions,
          laps,
          teamRadio,
          pitStops,
          intervals,
          raceControl,
          stints,
        };
      }),
    ).subscribe(state => this.#replayState$.next(state));
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
      tap(() => this.#radioStatus$.next({ latestUpdate: DateTime.now() })),
    );
  }

  getPitStops(_race: IRace, drivers: IDriver[], teams: ITeam[]): Observable<IPitStop[]> {
    return this.#replayState$.pipe(
      truthy(),
      map(state => state.pitStops.filter(p => !p.date || DateTime.fromISO(p.date) <= state.currentTime)),
      map(pitStops => mapper.pitStops({ pitStops, drivers, teams })),
      tap(() => this.#pitStopStatus$.next({ latestUpdate: DateTime.now() })),
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
        this.#positionStatus$.next({ latestUpdate });
      }),
      map(({ positions, gridPositions }) => mapper.position({ positions, race, drivers, gridPositions })),
    );
  }

  getIntervals(_race: IRace, drivers: IDriver[]): Observable<IDriverInterval[]> {
    return this.#replayState$.pipe(
      truthy(),
      map(state => state.intervals.filter(i => !i.date || DateTime.fromISO(i.date) <= state.currentTime)),
      map(intervals => mapper.intervalMapper({ intervals, drivers })),
      tap(() => this.#intervalStatus$.next({ latestUpdate: DateTime.now() })),
    );
  }

  getRaceControl(_race: IRace, drivers: IDriver[]): Observable<RaceControl[]> {
    return this.#replayState$.pipe(
      truthy(),
      map(state => state.raceControl.filter(m => !m.date || DateTime.fromISO(m.date) <= state.currentTime)),
      map(messages => mapper.raceControl({ messages, drivers })),
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
}