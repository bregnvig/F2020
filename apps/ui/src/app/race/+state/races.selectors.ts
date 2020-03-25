import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  RACES_FEATURE_KEY,
  State,
  RacesPartialState,
  racesAdapter
} from './races.reducer';

// Lookup the 'Races' feature state managed by NgRx
export const getRacesState = createFeatureSelector<RacesPartialState, State>(
  RACES_FEATURE_KEY
);

const { selectAll, selectEntities } = racesAdapter.getSelectors();

export const getRacesLoaded = createSelector(
  getRacesState,
  (state: State) => state.loaded
);

export const getRacesError = createSelector(
  getRacesState,
  (state: State) => state.error
);

export const getAllRaces = createSelector(
  getRacesState,
  (state: State) => selectAll(state)
);

export const getRacesEntities = createSelector(
  getRacesState,
  (state: State) => selectEntities(state)
);

export const getSelectedId = createSelector(
  getRacesState,
  (state: State) => state.selectedId
);

export const getSelected = createSelector(
  getRacesEntities,
  getSelectedId,
  (entities, selectedId) => selectedId && entities[selectedId]
);

export const getCurrentBid = createSelector(
  getRacesState,
  state => state.currentBid
);

export const getBids = createSelector(
  getRacesState,
  state => state.bids
);
