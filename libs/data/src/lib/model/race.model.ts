import { DateTime } from 'luxon';
import { Bid } from './bid.model';
import { Coordinate } from './coordinate.model';
import { IDriver, IDriverQualifying, IDriverRaceResult } from './driver.model';
import { Player } from './player.model';
import { ITeam } from './team.model';

export type State = 'waiting' | 'open' | 'closed' | 'completed' | 'cancelled';

export type RaceSessionType = 'practice' | 'sprint-qualifying' | 'sprint' | 'qualifying' | 'race';

/** A session of the race weekend, from the calendar */
export interface IRaceSession {
  readonly type: RaceSessionType;
  /** The number of a practice session */
  readonly number?: number;
  readonly start: DateTime;
  readonly end: DateTime;
}

/** The id of a session in the weekend, e.g. `practice-1` or `qualifying` */
export const sessionId = (session: Pick<IRaceSession, 'type' | 'number'>) => (session.type === 'practice' ? `practice-${session.number}` : session.type);

const sessionNames: Record<Exclude<RaceSessionType, 'practice'>, string> = {
  'sprint-qualifying': 'Sprint kvalifikation',
  sprint: 'Sprint',
  qualifying: 'Kvalifikation',
  race: 'Løb',
};

/** The name of the session in the app, e.g. `1. træning` */
export const sessionName = (session: Pick<IRaceSession, 'type' | 'number'>) => (session.type === 'practice' ? `${session.number}. træning` : sessionNames[session.type]);

export interface IDriverSessionResult {
  driver: IDriver;
  /** Missing when the driver isn't classified */
  position?: number;
  laps: number;
  /** In milliseconds. The best lap in practice and qualifying, the total time in the sprint and the race */
  duration?: number;
  /** In milliseconds, or the laps behind, e.g. `+1 LAP` */
  gapToLeader?: number | string;
  status?: 'dnf' | 'dns' | 'dsq';
}

/** The result of a session, stored by the session id under the race once the session is over */
export interface ISessionResult {
  session: IRaceSession;
  results: IDriverSessionResult[];
}

export interface IRaceBasis {
  readonly round: number;
  readonly season: number;
  readonly name: string;
  readonly countryCode: string;
  readonly location: Coordinate;
  readonly circuitId?: number;
  readonly url?: string;
}

export interface RaceUpdatedBy extends Pick<IRace, 'close' | 'selectedDriver'> {
  player: Pick<Player, 'displayName' | 'photoURL' | 'uid'>;
  updatedAt: DateTime;
  previous?: Pick<IRace, 'close' | 'selectedDriver'>;
}

export interface IRace extends IRaceBasis {
  state: State;
  readonly open: DateTime;
  readonly close: DateTime;
  readonly raceStart: DateTime;
  /** The sessions of the weekend in the order they are driven. Missing on races built before it was added */
  readonly schedule?: IRaceSession[];
  drivers?: string[];
  teams?: ITeam[];
  selectedDriver: string;
  selectedTeam?: ITeam;
  result?: Bid;
  updatedBy?: Partial<RaceUpdatedBy>[];
}

export interface IRaceResult extends IRaceBasis {
  results: IDriverRaceResult[];
}

export interface IQualifyResult extends IRaceBasis {
  results: IDriverQualifying[];
}

export type QualifyPhase = 1 | 2 | 3;

export interface ILiveDriverQualifying extends IDriverQualifying {
  /** The part of the qualifying where the driver was knocked out */
  knockedOutIn?: 1 | 2;
  /** Milliseconds behind the fastest driver in the same part */
  gap?: number;
}

/** A qualifying while it is being driven. `duration` is the best lap in the part the driver is in */
export interface ILiveQualifyResult extends IQualifyResult {
  results: ILiveDriverQualifying[];
  phase: QualifyPhase;
  /** True between the parts, e.g. after Q1 and before Q2 */
  phaseFinished: boolean;
}
