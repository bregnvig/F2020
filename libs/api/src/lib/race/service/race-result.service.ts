import { ChampionshipStarts, IDriver, IFastestLaps, IDriverGridPosition, IDriverInterval, IDriverRaceResult, IDriverSector, IPitStop, IQualifyResult, IRace, IRaceResult, IStint, ITeam, LocationPlayback, mapper, RaceControl, RetiredCars, TeamRadio } from '@f2020/data';
import { inject, InjectionToken } from '@angular/core';
import { DateTime } from 'luxon';
import { BehaviorSubject, combineLatest, map, Observable, of, retry, shareReplay, switchMap, take, tap, timer } from 'rxjs';
import { StandingService } from '../../service/standing.service';
import { TeamService } from '../../service/team.service';
import { OpenF1HttpService } from './openf1-http.service';
import { RacesService } from './races.service';

export interface LiveStatus {
  error?: any;
  latestUpdate: DateTime | null;
  info?: string;
}

/** What the live pages of the race and the qualifying have in common */
export abstract class LiveSessionService {
  abstract readonly radioStatus: Observable<LiveStatus>;
  abstract readonly raceControlStatus: Observable<LiveStatus>;

  abstract getRadio(race: IRace, drivers: IDriver[]): Observable<TeamRadio[] | null>;

  abstract getRaceControl(race: IRace, drivers: IDriver[]): Observable<RaceControl[]>;
}

/** The session of the live page, used by the team radio and the race control messages */
export const LiveSessionProvider = new InjectionToken<LiveSessionService>('LiveSessionService');

export abstract class RaceResultService extends LiveSessionService {
  abstract readonly resultStatus: Observable<LiveStatus>;
  abstract readonly pitStopStatus: Observable<LiveStatus>;
  abstract readonly positionStatus: Observable<LiveStatus>;
  abstract readonly intervalStatus: Observable<LiveStatus>;
  abstract readonly stintStatus: Observable<LiveStatus>;
  abstract readonly sectorStatus: Observable<LiveStatus>;
  abstract readonly currentLap: BehaviorSubject<number>;

  abstract getResult(race: IRace, drivers: IDriver[]): Observable<{ result: IRaceResult, latestUpdate: DateTime; } | null>;

  abstract getPitStops(race: IRace, drivers: IDriver[], teams: ITeam[]): Observable<IPitStop[]>;

  abstract getPositions(race: IRace, drivers: IDriver[]): Observable<IDriverRaceResult[]>;

  abstract getIntervals(race: IRace, drivers: IDriver[]): Observable<IDriverInterval[]>;

  abstract getStints(race: IRace, drivers: IDriver[]): Observable<IStint[]>;

  abstract getGrid(race: IRace, drivers: IDriver[]): Observable<IDriverGridPosition[]>;

  abstract getSectorStatus(race: IRace, drivers: IDriver[]): Observable<IDriverSector[]>;

  /** Every stint of every driver so far */
  abstract getStrategy(race: IRace, drivers: IDriver[]): Observable<IStint[]>;

  /** The best lap and the top speed of each driver so far */
  abstract getFastestLaps(race: IRace, drivers: IDriver[]): Observable<IFastestLaps>;

  abstract readonly locationStatus: Observable<LiveStatus>;
  /** Which cars are out of the race, kept for the page so every track on it agrees */
  readonly retiredCars = new RetiredCars();

  #racesService = inject(RacesService);
  #openF1HttpService = inject(OpenF1HttpService);
  #standingService = inject(StandingService);
  #teamService = inject(TeamService);
  #qualify$?: Observable<IQualifyResult | undefined>;
  #qualifyStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  readonly qualifyStatus = this.#qualifyStatus$.asObservable();
  #championshipStart$?: Observable<ChampionshipStarts>;
  #championshipStatus$ = new BehaviorSubject<LiveStatus>({ latestUpdate: null });
  readonly championshipStatus = this.#championshipStatus$.asObservable();

  /** The result of the qualifying, fetched once for the page. Every players list on it uses it */
  getQualify(race: IRace, drivers: IDriver[]): Observable<IQualifyResult | undefined> {
    this.#qualify$ ??= this.#racesService.getQualify(race, drivers).pipe(
      tap({
        next: qualify => this.#qualifyStatus$.next({ latestUpdate: DateTime.now(), info: `${qualify?.results.length ?? 0} drivers` }),
        error: error => this.#qualifyStatus$.next({ latestUpdate: DateTime.now(), error }),
      }),
      shareReplay(1),
    );
    return this.#qualify$;
  }

  /**
   * The championship before the race, fetched once for the page. OpenF1 only has the championship of the race after it, so a live race
   * uses the stored standings, which are from before the race until it has ended
   */
  getChampionshipStart(race: IRace, drivers: IDriver[]): Observable<ChampionshipStarts> {
    this.#championshipStart$ ??= this.#openF1HttpService.getSession(race, 'Race').pipe(
      switchMap(({ session_key }) => combineLatest([
        this.#openF1HttpService.getChampionshipDrivers(session_key),
        this.#openF1HttpService.getChampionshipTeams(session_key),
      ])),
      switchMap(([driverChampionship, teamChampionship]) => driverChampionship.length
        ? of(mapper.championship(drivers, driverChampionship, teamChampionship))
        : this.#storedChampionship(race)),
      retry({ count: 4, delay: (_error, attempt) => timer(2000 * attempt) }),
      tap({
        next: ({ drivers }) => this.#championshipStatus$.next({ latestUpdate: DateTime.now(), info: `${drivers.size} drivers` }),
        error: error => this.#championshipStatus$.next({ latestUpdate: DateTime.now(), error }),
      }),
      shareReplay(1),
    );
    return this.#championshipStart$;
  }

  #storedChampionship(race: IRace): Observable<ChampionshipStarts> {
    return combineLatest([
      this.#standingService.getStandings(race.season).pipe(take(1)),
      this.#teamService.teams$.pipe(take(1)),
    ]).pipe(
      map(([standings, teams]) => ({
        drivers: new Map(standings.map(({ driver, points, position }) => [driver.driverId, { points, position }])),
        teams: new Map(teams.map(({ name, points, position }) => [name, { points, position }])),
      })),
    );
  }

  /** The locations of the cars, and the time to draw them at */
  abstract getLocationPlayback(race: IRace, drivers: IDriver[]): Observable<LocationPlayback>;
}
