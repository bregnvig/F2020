import { createFeatureSelector, createSelector } from '@ngrx/store';
import { STANDING_FEATURE_KEY, StandingPartialState, State } from './standing.reducer';

// Lookup the 'Standing' feature state managed by NgRx
export const getStandingState = createFeatureSelector<
  State
>(STANDING_FEATURE_KEY);

export const getStandingLoaded = createSelector(
  getStandingState,
  (state: State) => state.loaded
);

export const getStandingError = createSelector(
  getStandingState,
  (state: State) => state.error
);

export const getStandings = createSelector(
  getStandingState,
  (state: State) => state.standings
);
