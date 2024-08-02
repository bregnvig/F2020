import { ISeason } from '@f2020/data';
import { SeasonService } from '../service/season.service';
import { inject } from '@angular/core';
import { distinctUntilChanged, pipe, switchMap, tap } from 'rxjs';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';

export interface SeasonState {
  season: ISeason | undefined;
  loaded: boolean; // has the Season list been loaded
  error: string | undefined; // last none error (if any)
}

export const SeasonStore = signalStore(
  { providedIn: 'root' },
  withState<SeasonState>({
    season: undefined,
    loaded: false,
    error: undefined,
  }),
  withMethods((store, service = inject(SeasonService)) => ({
      loadSeason: rxMethod<string>(
        pipe(
          distinctUntilChanged(),
          tap(() => patchState(store, { loaded: false, season: undefined, error: undefined })),
          switchMap((seasonId: string) => service.loadSeason(seasonId).pipe(
              tapResponse({
                next: season => patchState(store, { season, loaded: true }),
                error: error => patchState(store, { error: error?.toString() }),
              }),
            ),
          ),
        )),
    }),
  ));
