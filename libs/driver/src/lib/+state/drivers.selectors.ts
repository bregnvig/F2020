import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DRIVERS_FEATURE_KEY, DriversPartialState, State } from './drivers.reducer';

// Lookup the 'Driver' feature state managed by NgRx
export const getDriversState = createFeatureSelector< State>(
  DRIVERS_FEATURE_KEY,
);

export const getDriversLoaded = createSelector(
  getDriversState,
  (state: State) => state.loaded,
);

export const getDriversError = createSelector(
  getDriversState,
  (state: State) => state.error,
);

export const getAllDriver = createSelector(
  getDriversState,
  (state: State) => state.drivers,
);
