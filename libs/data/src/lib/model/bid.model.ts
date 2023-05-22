import { Player } from './player.model';


export interface SelectedDriverValue {
  grid: number;
  gridPoints?: number;
  finish?: number;
  finishPoints?: number;
}

export interface SelectedTeamValue {
  qualify: string;
  qualifyPoints?: number;
  result?: string;
  resultPoints?: number;
}

export interface Bid {
  qualify: [string, string, string, string, string, string, string?];
  qualifyPoints?: [number, number, number, number, number, number];
  fastestDriver: [string?, string?];
  fastestDriverPoints?: [number];
  firstCrash: [string?, string?, string?];
  firstCrashPoints?: [number];
  podium: [string, string, string, string?];
  podiumPoints?: [number, number, number];
  selectedDriver: SelectedDriverValue;
  selectedTeam?: SelectedTeamValue;
  slowestPitStop?: [string?, string?];
  slowestPitStopPoints?: [number];
  polePositionTime: number;
  polePositionTimeDiff?: number;
  submitted?: boolean;
  points?: number;
  player?: Player;
}
