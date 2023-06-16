import { inject } from '@angular/core';
import { SeasonFacade } from '@f2020/api';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, concatMap, map, switchMap } from 'rxjs/operators';
import { StandingService } from '../service/standing.service';
import { StandingActions } from './standing.actions';

export const loadStanding$ = createEffect((
  actions$ = inject(Actions),
  service = inject(StandingService),
  seasonFacade = inject(SeasonFacade),
) => actions$.pipe(
  ofType(StandingActions.loadStandings),
  switchMap(() => seasonFacade.season$),
  concatMap(season => season ? service.getStandings(season.id).pipe(
    map(standings => StandingActions.loadStandingsSuccess({ standings })),
    catchError(error => of(StandingActions.loadStandingsFailure({ error }))),
  ) : of(StandingActions.loadStandingsSuccess({ standings: null }))),
), { functional: true });