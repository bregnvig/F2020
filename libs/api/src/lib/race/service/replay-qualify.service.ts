import { inject, Service } from '@angular/core';
import { IDriver, ILiveQualifyResult, IRace, mapper, RaceControl, TeamRadio } from '@f2020/data';
import { Lap, Position, RaceControl as OpenF1RaceControl, TeamRadio as OpenF1TeamRadio } from '@f2020/openf1';
import { truthy } from '@f2020/tools';
import { DateTime } from 'luxon';
import { BehaviorSubject, firstValueFrom, map, Observable, take, tap, timer } from 'rxjs';
import { OpenF1HttpService } from './openf1-http.service';
import { QualifyResultService } from './qualify-result.service';
import { LiveStatus } from './race-result.service';

interface ReplayState {
  currentTime: DateTime;
  positions: Position[];
  laps: Lap[];
  raceControl: OpenF1RaceControl[];
  teamRadio: OpenF1TeamRadio[];
}

/** How long the replay of the whole qualifying takes */
const replayDuration = 120_000;
const replayStep = 500;

const isBefore = (date: string | null | undefined, time: DateTime) => !date || DateTime.fromISO(date) <= time;

/** A lap time is known when the lap has been driven */
const lapEnd = (lap: Lap) => DateTime.fromISO(lap.date_start).plus({ seconds: lap.lap_duration ?? 0 });

@Service({ autoProvided: false })
export class ReplayQualifyService extends QualifyResultService {
  #openF1HttpService = inject(OpenF1HttpService);

  #resultStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #radioStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #raceControlStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  #replayState$ = new BehaviorSubject<ReplayState | null>(null);
  #started = false;

  readonly resultStatus = this.#resultStatus$.asObservable();
  readonly radioStatus = this.#radioStatus$.asObservable();
  readonly raceControlStatus = this.#raceControlStatus$.asObservable();

  async #startReplay(race: IRace) {
    if (this.#started) {
      return;
    }
    this.#started = true;

    try {
      const session = await firstValueFrom(this.#openF1HttpService.getSession(race, 'Qualifying'));
      const sessionKey = session.session_key;
      // One request at a time, as OpenF1 allows few requests per second
      const positions = await firstValueFrom(this.#openF1HttpService.getPositions(sessionKey));
      const laps = await firstValueFrom(this.#openF1HttpService.getLaps(sessionKey));
      const raceControl = await firstValueFrom(this.#openF1HttpService.getRaceControl(sessionKey));
      const teamRadio = await firstValueFrom(this.#openF1HttpService.getTeamRadio(race, sessionKey));

      const start = DateTime.fromISO(session.date_start);
      // A red flag makes the qualifying run longer than planned
      const end = DateTime.max(DateTime.fromISO(session.date_end), ...raceControl.map(message => DateTime.fromISO(message.date)));
      const totalSteps = replayDuration / replayStep;
      const timeStep = end.diff(start).as('milliseconds') / totalSteps;

      timer(0, replayStep).pipe(
        take(totalSteps + 1),
        map(step => ({
          currentTime: start.plus({ milliseconds: step * timeStep }),
          positions,
          laps,
          raceControl,
          teamRadio,
        })),
      ).subscribe(state => this.#replayState$.next(state));
    } catch (error) {
      this.#started = false;
      this.#resultStatus$.next({ latestUpdate: DateTime.now(), error });
    }
  }

  getResult(race: IRace, drivers: IDriver[]): Observable<ILiveQualifyResult> {
    this.#startReplay(race);
    return this.#replayState$.pipe(
      truthy(),
      map(state => mapper.liveQualifyResult({
        positions: state.positions.filter(position => isBefore(position.date, state.currentTime)),
        laps: state.laps.filter(lap => !lap.date_start || lapEnd(lap) <= state.currentTime),
        raceControl: state.raceControl.filter(message => isBefore(message.date, state.currentTime)),
        drivers,
        race,
      })),
      tap(result => this.#resultStatus$.next({
        latestUpdate: this.#replayState$.value?.currentTime ?? null,
        info: `Q${result.phase}, ${result.results.length} drivers`,
      })),
    );
  }

  getRadio(race: IRace, drivers: IDriver[]): Observable<TeamRadio[] | null> {
    this.#startReplay(race);
    return this.#replayState$.pipe(
      truthy(),
      map(state => state.teamRadio.filter(message => isBefore(message.date, state.currentTime))),
      map(messages => mapper.radio({ messages, drivers }).toSorted((a, b) => b.date.valueOf() - a.date.valueOf())),
      tap(messages => this.#radioStatus$.next({
        latestUpdate: DateTime.now(),
        info: `${messages.length} messages`,
      })),
    );
  }

  getRaceControl(race: IRace, drivers: IDriver[]): Observable<RaceControl[]> {
    this.#startReplay(race);
    return this.#replayState$.pipe(
      truthy(),
      map(state => state.raceControl.filter(message => isBefore(message.date, state.currentTime))),
      map(messages => mapper.raceControl({ messages, drivers })),
      tap(messages => this.#raceControlStatus$.next({
        latestUpdate: DateTime.now(),
        info: `${messages.length} race control messages`,
      })),
    );
  }
}
