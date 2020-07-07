import { Player } from './player.model';
import { DateTime } from 'luxon';

export interface WBC {
  results?: WBCResult[];
  latestWBCJoinDate: DateTime;
  participants?: string[];
}

export interface WBCResult {
  raceName: string;
  round: number;
  countryCode: string;
  players: WBCPlayer[]
}

export interface WBCPlayer {
  points: number;
  player: Player;
}
