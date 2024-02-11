import { Bid, IRace, Participant, RoundResult } from '@f2020/data';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
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
  participants?: Participant[];
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
  on(
    RacesActions.loadResultFailure,
    RacesActions.loadInterimResultFailure,
    RacesActions.submitResultFailure,
    RacesActions.submitInterimResultFailure,
    (state, { type, error }) => {
      console.error(type, error);
      return { ...state, error: error['message'] ?? error, updating: false, loaded: false };
    },
  ),
  on(RacesActions.loadResult, (state) => ({ ...state, loaded: false })),
  on(RacesActions.loadResultSuccess, (state, { result }) => ({ ...state, result, loaded: true })),
  on(RacesActions.loadInterimResultSuccess, (state, { result }) => ({ ...state, interimResult: result, loaded: true })),
  on(RacesActions.submitResult, (state) => ({ ...state, updating: true })),
  on(RacesActions.submitResultSuccess, (state) => ({ ...state, updating: false })),
  on(RacesActions.submitInterimResult, (state) => ({ ...state, updating: true })),
  on(RacesActions.submitInterimResultSuccess, (state) => ({ ...state, updating: false })),
);

export function reducer(state: State | undefined, action: Action) {
  return racesReducer(state, action);
}
