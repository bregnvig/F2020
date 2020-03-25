import { DateTime } from 'luxon';
import { CoordinateModel } from './coordinate.model';

export type State = 'waiting' | 'open' | 'closed' | 'completed';

export interface IRaceBasis {
  readonly round: number;
  readonly name: string;
  readonly location: CoordinateModel;
  readonly url: string;
}

export interface IRace extends IRaceBasis {
  state: State;
  readonly open: DateTime;
  readonly close: DateTime;
  drivers?: string[];
  selectedDriver: string;
}
