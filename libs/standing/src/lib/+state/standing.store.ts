import { inject } from '@angular/core';
import { SeasonStore } from '@f2020/api';
import { IDriverStanding } from '@f2020/data';
import { StandingService } from '../service/standing.service';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';

export interface StandingState {
  standings?: IDriverStanding[];
  loaded: boolean; // has the Standing list been loaded
  error?: string | undefined; // last none error (if any)
}

const initialState: StandingState = {
  standings: undefined,
  loaded: false,
  error: undefined,
};

export const StandingStore = signalStore(
  withState(initialState),
  withMethods((store, service = inject(StandingService), season = inject(SeasonStore)) => ({
    loadStandings: rxMethod<void>(
      pipe(
        tap(() => patchState(store, initialState)),
        switchMap(() => service.getStandings(season.season().id).pipe(
          tapResponse({
            next: standings => patchState(store, { standings, loaded: true }),
            error: error => patchState(store, { error: error?.toString() }),
          }),
        )),
      )),
  })),
);
