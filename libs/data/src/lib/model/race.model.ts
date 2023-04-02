import { DateTime } from 'luxon';
import { Bid } from './bid.model';
import { CoordinateModel } from './coordinate.model';
import { IDriverQualifying, IDriverRaceResult } from './driver.model';
import { Player } from './player.model';
import { ITeam } from './team.model';

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

export interface RaceUpdatedBy extends Pick<IRace, 'close' | 'selectedDriver'> {
  player: Pick<Player, 'displayName' | 'photoURL' | 'uid'>;
}

export interface IRace extends IRaceBasis {
  state: State;
  readonly open: DateTime;
  readonly close: DateTime;
  drivers?: string[];
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
