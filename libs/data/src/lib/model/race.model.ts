import { Bid } from './bid.model';
import { DateTime } from 'luxon';
import { CoordinateModel } from './coordinate.model';
import { IDriverRaceResult, IDriverQualifying } from './driver.model';

export type State = 'waiting' | 'open' | 'closed' | 'completed';

export interface IRaceBasis {
  readonly round: number;
  readonly season: number;
  readonly name: string;
  readonly raceStart: DateTime;
  readonly countryCode: string;
  readonly location: CoordinateModel;
  readonly url: string;
}

export interface IRace extends IRaceBasis {
  state: State;
  readonly open: DateTime;
  readonly close: DateTime;
  drivers?: string[];
  selectedDriver: string;
  selectedTeam?: string;
  result?: Bid;
}

export interface IRaceResult extends IRaceBasis {
  results: IDriverRaceResult[];
}

export interface IQualifyResult extends IRaceBasis {
  results: IDriverQualifying[];
}
