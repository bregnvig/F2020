import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, concatMap, map, takeUntil } from 'rxjs/operators';
import { SeasonService } from '../service/season.service';
import { SeasonActions } from './season.actions';

export const loadSeason$ = createEffect((
  actions$ = inject(Actions),
  service = inject(SeasonService)
) => actions$.pipe(
  ofType(SeasonActions.loadSeason),
  concatMap(({ seasonId }) => {
    return service.loadSeason(seasonId).pipe(
      map(season => SeasonActions.loadSeasonSuccess({ season })),
      catchError(error => of(SeasonActions.loadSeasonFailure({ error: error['message'] ?? error }))),
      takeUntil(actions$.pipe(ofType(SeasonActions.loadSeason)))
    );
  }),
), { functional: true });
