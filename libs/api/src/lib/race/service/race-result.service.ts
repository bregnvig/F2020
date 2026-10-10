import { IDriver, IDriverGridPosition, IDriverInterval, IDriverRaceResult, IDriverSector, IPitStop, IRace, IRaceResult, IStint, ITeam, RaceControl, TeamRadio } from '@f2020/data';
import { InjectionToken } from '@angular/core';
import { DateTime } from 'luxon';
import { BehaviorSubject, Observable } from 'rxjs';

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
}
