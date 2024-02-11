import { inject } from '@angular/core';
import { truthy } from '@f2020/tools';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { combineLatest, of } from 'rxjs';
import { catchError, concatMap, debounceTime, first, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { TeamService } from '../../service';
import { RacesService } from '../service/races.service';
import { buildInterimResult, buildResult } from './../service/result-builder';
import { RacesActions } from './races.actions';
import { RacesFacade } from './races.facade';
import { DriversStore } from '../../drivers';

export const loadResult$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  driversStore = inject(DriversStore),
  service = inject(RacesService),
  teamsService = inject(TeamService),
) => {
  return actions$.pipe(
    ofType(RacesActions.loadResult),
    withLatestFrom(teamsService.teams$, facade.allRaces$),
    concatMap(([, teams, races]) => facade.selectedRace$.pipe(
      debounceTime(200),
      truthy(),
      switchMap(race => {
        const offset = races.filter(r => r.round < race.round && r.state === 'cancelled').length;
        return combineLatest([
          service.getResult(race.season, race.round - offset),
          service.getQualify(race.season, race.round - offset),
          service.getPitStops(race.season, race.round - offset, driversStore.drivers(), teams),
          of(race.selectedDriver),
          of(race.selectedTeam),
        ]);
      }),
      map(([raceResult, qualify, pitStops, selectedDriver, selectedTeam]) => {
        const result = buildResult(raceResult, qualify, pitStops, selectedDriver, selectedTeam);
        return RacesActions.loadResultSuccess({ result });
      }),
      first(),
      catchError(error => of(RacesActions.loadResultFailure({ error }))),
    )));

}, { functional: true });

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

export const submitResult$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  service = inject(RacesService),
) => {
  return actions$.pipe(
    ofType(RacesActions.submitResult),
    withLatestFrom(facade.selectedRace$),
    concatMap(([{ result }, race]) => service.submitResult(race.round, result)
      .then(() => RacesActions.submitResultSuccess())
      .catch(error => RacesActions.submitResultFailure({ error })),
    ),
    first());

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


