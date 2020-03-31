import { Player } from './player.model';


export interface SelectedDriverValue {
  grid: number;
  finish: number;
}

export interface Bid {
  qualify: [string, string, string, string, string, string];
  fastestDriver: [string];
  podium: [string, string, string];
  selectedDriver: SelectedDriverValue;
  polePositionTime: number;
  submitted?:  boolean;
  player?: Player;
}