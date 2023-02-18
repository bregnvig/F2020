import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, concatMap, map, takeUntil } from 'rxjs/operators';
import { SeasonService } from '../service/season.service';
import { SeasonActions } from './season.actions';

@Injectable()
export class SeasonEffects {

  loadSeason$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SeasonActions.loadSeason),
      concatMap(({ seasonId }) => {
        return this.service.loadSeason(seasonId).pipe(
          map(season => SeasonActions.loadSeasonSuccess({ season })),
          catchError(error => of(SeasonActions.loadSeasonFailure({ error: error['message'] ?? error }))),
          takeUntil(this.actions$.pipe(ofType(SeasonActions.loadSeason)))
        );
      }),
    ),
  );

  constructor(private actions$: Actions, private service: SeasonService) {
  }
}
