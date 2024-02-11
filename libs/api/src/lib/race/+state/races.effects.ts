import { inject } from '@angular/core';
import { truthy } from '@f2020/tools';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { combineLatest, of } from 'rxjs';
import { catchError, concatMap, debounceTime, first, map, switchMap } from 'rxjs/operators';
import { RacesService } from '../service/races.service';
import { buildInterimResult } from './../service/result-builder';
import { RacesActions } from './races.actions';
import { RacesFacade } from './races.facade';

export const loadInterimResult$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  service = inject(RacesService),
) => {
  return actions$.pipe(
    ofType(RacesActions.loadInterimResult),
    concatMap(() => facade.selectedRace$.pipe(
      debounceTime(200),
      truthy(),
      switchMap(race => combineLatest([
        service.getQualify(race.season, race.round),
        of(race.selectedDriver),
        of(race.selectedTeam),
      ])),
      map(([qualify, selectedDriver, selectedTeam]) => {
        const result = buildInterimResult(qualify, selectedDriver, selectedTeam);
        return RacesActions.loadInterimResultSuccess({ result });
      }),
      first(),
      catchError(error => of(RacesActions.loadInterimResultFailure({ error }))),
    )));

}, { functional: true });

export const submitInterimResult$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  service = inject(RacesService),
) => {
  return actions$.pipe(
    ofType(RacesActions.submitInterimResult),
    concatMap(() => facade.interimResult$.pipe(
      switchMap(result => service.submitInterimResult(result)
        .then(() => RacesActions.submitInterimResultSuccess())
        .catch(error => RacesActions.submitInterimResultFailure({ error })),
      )),
    ));

}, { functional: true });


