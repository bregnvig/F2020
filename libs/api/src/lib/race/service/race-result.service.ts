import { IDriver, IDriverGridPosition, IDriverInterval, IDriverRaceResult, IDriverSector, IPitStop, IRace, IRaceResult, IStint, ITeam, RaceControl, TeamRadio } from '@f2020/data';
import { DateTime } from 'luxon';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LiveStatus {
  error?: any;
  latestUpdate: DateTime | null;
  info?: string;
}

export abstract class RaceResultService {
  abstract readonly resultStatus: Observable<LiveStatus>;
  abstract readonly radioStatus: Observable<LiveStatus>;
  abstract readonly pitStopStatus: Observable<LiveStatus>;
  abstract readonly positionStatus: Observable<LiveStatus>;
  abstract readonly intervalStatus: Observable<LiveStatus>;
  abstract readonly stintStatus: Observable<LiveStatus>;
  abstract readonly raceControlStatus: Observable<LiveStatus>;
  abstract readonly sectorStatus: Observable<LiveStatus>;
  abstract readonly currentLap: BehaviorSubject<number>;

  abstract getResult(race: IRace, drivers: IDriver[]): Observable<{ result: IRaceResult, latestUpdate: DateTime; } | null>;

  abstract getRadio(race: IRace, drivers: IDriver[]): Observable<TeamRadio[] | null>;

  abstract getPitStops(race: IRace, drivers: IDriver[], teams: ITeam[]): Observable<IPitStop[]>;

  abstract getPositions(race: IRace, drivers: IDriver[]): Observable<IDriverRaceResult[]>;

  abstract getIntervals(race: IRace, drivers: IDriver[]): Observable<IDriverInterval[]>;

  abstract getRaceControl(race: IRace, drivers: IDriver[]): Observable<RaceControl[]>;

  abstract getStints(race: IRace, drivers: IDriver[]): Observable<IStint[]>;

  abstract getGrid(race: IRace, drivers: IDriver[]): Observable<IDriverGridPosition[]>;

  abstract getSectorStatus(race: IRace, drivers: IDriver[]): Observable<IDriverSector[]>;
}
