import { Bid, IRace, IRaceResult } from '@f2020/data';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { Action, createReducer, on } from '@ngrx/store';
import { RacesActions } from './races.actions';


export const RACES_FEATURE_KEY = 'races';

export interface State extends EntityState<IRace> {
  currentRace?: IRace;
  previousRace?: IRace;
  selectedId?: string; // which Races record has been selected
  yourBid?: Partial<Bid>;
  bids?: Bid[];
  bid?: Partial<Bid>;
  result?: Bid;
  updating: boolean; // Is something updating
  loaded: boolean; // has the Races list been loaded
  error?: string | null; // last none error (if any)
}

export interface RacesPartialState {
  readonly [RACES_FEATURE_KEY]: State;
}

export const racesAdapter: EntityAdapter<IRace> = createEntityAdapter<IRace>({
  sortComparer: (a, b) => a.open.toMillis() - b.open.toMillis(),
  selectId: a => a.round,
});

export const initialState: State = racesAdapter.getInitialState(<State>{
  // set initial required properties
  currentRace: null,
  previousRace: null,
  selectedId: null,
  loaded: false,
});

const racesReducer = createReducer(
  initialState,
  on(RacesActions.loadRaces, state => ({
    ...state,
    loaded: false,
    error: null,
  })),
  on(RacesActions.loadRacesSuccess, (state, { races }) =>
    racesAdapter.setAll(races, { ...state, loaded: true }),
  ),
  on(
    RacesActions.loadRacesFailure, 
    RacesActions.loadYourBidFailure,
    RacesActions.loadBidsFailure,
    RacesActions.loadBidFailure,
    RacesActions.loadBidFailure,
    RacesActions.loadResultFailure,
    RacesActions.updateYourBidFailure,
    RacesActions.submitBidFailure,
    RacesActions.submitResultFailure,
    RacesActions.updateRaceDriversFailure,
    (state, { type, error }) => {
      console.error(type, error);
      return { ...state, error: error['message'] ?? error, updating: false, loaded: false }
    }
  ),
  on(RacesActions.selectRace, (state, { country }) => ({ 
      ...state, 
      selectedId: country,
      bids: null,
      bid: null,
      yourBid: null, 
    })
  ),
  on(RacesActions.loadYourBidSuccess, (state, { bid }) => ({ ...state, yourBid: bid })),
  on(RacesActions.loadBidsSuccess, (state, { bids }) => ({ ...state, bids })),
  on(RacesActions.loadBidSuccess, (state, { bid }) => ({ ...state, bid })),
  on(RacesActions.loadResult, (state) => ({ ...state, loaded: false })),
  on(RacesActions.loadResultSuccess, (state, { result }) => ({ ...state, result, loaded: true })),
  on(RacesActions.submitBid, (state) => ({ ...state, updating: true })),
  on(RacesActions.submitBidSuccess, (state) => ({ ...state, updating: false })),
  on(RacesActions.submitResult, (state) => ({ ...state, updating: true })),
  on(RacesActions.submitResultSuccess, (state) => ({ ...state, updating: false })),
  on(RacesActions.updateRaceDrivers, (state) => ({ ...state, updating: true })),
  on(RacesActions.updateRaceDriversSuccess, (state) => ({ ...state, updating: false })),
);

export function reducer(state: State | undefined, action: Action) {
  return racesReducer(state, action);
}
