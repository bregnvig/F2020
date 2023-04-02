import { Bid, IRace, RoundResult } from '@f2020/data';
import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { Action, createReducer, on } from '@ngrx/store';
import { RacesActions } from './races.actions';


export const RACES_FEATURE_KEY = 'races';

export interface State extends EntityState<IRace> {
  previousRace?: IRace;
  selectedId?: string; // which Races record has been selected
  yourBid?: Partial<Bid>;
  bids?: Bid[];
  currentBids?: Bid[];
  bid?: Partial<Bid>;
  interimResult?: Partial<Bid>;
  result?: Bid;
  lastYear?: RoundResult,
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
    RacesActions.loadInterimResultFailure,
    RacesActions.updateYourBidFailure,
    RacesActions.submitBidFailure,
    RacesActions.submitResultFailure,
    RacesActions.submitInterimResultFailure,
    RacesActions.updateRaceDriversFailure,
    RacesActions.loadLastYearFailure,
    RacesActions.rollbackResultFailure,
    RacesActions.updateYourBidFailure,
    (state, { type, error }) => {
      console.error(type, error);
      return { ...state, error: error['message'] ?? error, updating: false, loaded: false };
    }
  ),
  on(RacesActions.selectRace, (state, { round }) => ({
    ...state,
    selectedId: round,
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
  on(RacesActions.loadInterimResultSuccess, (state, { result }) => ({ ...state, interimResult: result, loaded: true })),
  on(RacesActions.updateRace, (state) => ({ ...state, updating: true })),
  on(RacesActions.updateRaceSuccess, (state) => ({ ...state, updating: false })),
  on(RacesActions.submitBid, (state) => ({ ...state, updating: true })),
  on(RacesActions.submitBidSuccess, (state) => ({ ...state, updating: false })),
  on(RacesActions.submitResult, (state) => ({ ...state, updating: true })),
  on(RacesActions.submitResultSuccess, (state) => ({ ...state, updating: false })),
  on(RacesActions.submitInterimResult, (state) => ({ ...state, updating: true })),
  on(RacesActions.submitInterimResultSuccess, (state) => ({ ...state, updating: false })),
  on(RacesActions.rollbackResult, (state) => ({ ...state, updating: true })),
  on(RacesActions.rollbackResultSuccess, (state) => ({ ...state, updating: false })),
  on(RacesActions.updateRaceDrivers, (state) => ({ ...state, updating: true })),
  on(RacesActions.updateRaceDriversSuccess, (state) => ({ ...state, updating: false })),
  on(RacesActions.loadLastYear, state => ({ ...state, lastYear: null })),
  on(RacesActions.loadLastYearSuccess, (state, { result }) => ({ ...state, lastYear: result })),
);

export function reducer(state: State | undefined, action: Action) {
  return racesReducer(state, action);
}
