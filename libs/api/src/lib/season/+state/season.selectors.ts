import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  SEASON_FEATURE_KEY,
  State,
  SeasonPartialState,
} from './season.reducer';

// Lookup the 'Season' feature state managed by NgRx
export const getSeasonState = createFeatureSelector< State>(
  SEASON_FEATURE_KEY
);

export const getSeasonLoaded = createSelector(
  getSeasonState,
  (state: State) => state.loaded
);

export const getSeasonError = createSelector(
  getSeasonState,
  (state: State) => state.error
);

export const getSeason = createSelector(
  getSeasonState,
  (state: State) => state.season
);
