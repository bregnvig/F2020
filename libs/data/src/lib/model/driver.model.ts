import { IQualifyResult, IRaceResult } from './race.model';
import { ITeam } from './team.model';
import { Gap } from '@f2020/openf1';

export interface IDriver {
  readonly name: string;
  readonly driverId: string;
  readonly code: string;
  readonly nationality?: string;
  readonly countryCode?: string;
  readonly permanentNumber: number[];
  readonly url?: string;
  readonly headshotUrl?: string;
  readonly teamColor?: string;
  readonly teamName?: string;
}

export interface IFastestLap {
  rank: number;
  lap: number;
  time: number;
  averageSpeed?: number;
}

export interface IDriverStanding {
  wins: number;
  points: number;
  pointsByRace: Record<number, number>;
  driver: IDriver;
}

export interface IDriverResult {
  retired: number;
  averageGridPosition: number;
  averageFinishPosition: number;
  races: IRaceResult[];
  qualify: IQualifyResult[];
}

export const finished = (status?: string): boolean => /(\+[0-9] Lap)|(Gennemført)/.test(status ?? '');

export interface IDriverRaceResult {
  driver: IDriver;
  points: number;
  position: number;
  grid: number;
  status: string;
  fastestLap?: IFastestLap;
}

export type IDriverGridPosition = Pick<IDriverRaceResult, 'driver' | 'grid'>;

export interface IDriverQualifying {
  driver: IDriver;
  position: number;
  q1?: number;
  q2?: number;
  q3?: number;
  duration?: number;
}

export interface IDriverInterval {
  driver: IDriver;
  interval: Gap;
  gapToLeader: Gap;
}

export interface IPitStop {
  driver: IDriver;
  team: ITeam;
  stop?: number;
  lap: number;
  duration: number;
}
export type Tyre = 'HARD' | 'MEDIUM' | 'SOFT' | 'INTERMEDIATE' | 'FULL_WET';
export interface IStint {
  driver: IDriver;
  compound: Tyre;
  lapStart: number;
  lapEnd: number;
  stintNumber: number;
  tyreAgeAtStart: number;
}
