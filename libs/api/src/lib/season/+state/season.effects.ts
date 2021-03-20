import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { routerNavigatedAction } from '@ngrx/router-store';
import { of } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';
import { SeasonService } from '../service/season.service';
import { SeasonActions } from './season.actions';

@Injectable()
export class SeasonEffects {
  loadSeason$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SeasonActions.loadSeason, routerNavigatedAction),
      concatMap(action => {
        console.log(action);
        return this.service.current$.pipe(
          map(season => SeasonActions.loadSeasonSuccess({ season })),
          catchError(error => of(SeasonActions.loadSeasonFailure({ error: error['message'] ?? error }))),
        )
      }),
    ),
  );

  constructor(private actions$: Actions, private service: SeasonService) {
  }
}
