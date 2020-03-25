import { SelectedDriverValue } from '@f2020/control';
import { Player } from '@f2020/data';

export interface Bid {
  qualify: [string, string, string, string, string, string];
  fastestDriver: [string];
  podium: [string, string, string];
  selectedDriver: SelectedDriverValue;
  polePositionTime: number;
  submitted?:  boolean;
  player?: Player
}
