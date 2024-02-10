import { inject } from '@angular/core';
import { truthy } from '@f2020/tools';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { combineLatest, merge, of } from 'rxjs';
import { catchError, concatMap, debounceTime, filter, first, map, switchMap, takeUntil, withLatestFrom } from 'rxjs/operators';
import { PlayerStore } from '../../player';
import { SeasonStore } from '../../season/+state';
import { TeamService } from '../../service';
import { RacesService } from '../service/races.service';
import { buildInterimResult, buildResult } from './../service/result-builder';
import { RacesActions } from './races.actions';
import { RacesFacade } from './races.facade';
import { toObservable } from '@angular/core/rxjs-interop';
import { DriversStore } from '../../drivers';

export const loadYourBid$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  seasonFacade = inject(SeasonStore),
  playerStore = inject(PlayerStore),
  service = inject(RacesService),
) => {
  const player$ = toObservable(playerStore.player).pipe(truthy());
  const logoff$ = toObservable(playerStore.unauthorized).pipe(truthy());
  return actions$.pipe(
    ofType(RacesActions.loadYourBid, RacesActions.loadYourBidFromLanding),
    concatMap(() => combineLatest([
      seasonFacade.season$,
      facade.currentRace$,
      player$,
    ]).pipe(
      filter(([season, race, player]) => !!race),
      switchMap(([season, race, player]) => service.getBid(season.id, race.round, player.uid)),
      map(bid => bid || {}),
      map(bid => RacesActions.loadYourBidSuccess({ bid })),
      catchError(error => of(RacesActions.loadYourBidFailure({ error }))),
      takeUntil(merge(actions$.pipe(ofType(RacesActions.loadYourBid)), logoff$)),
    )));

}, { functional: true });

export const loadBids$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  seasonFacade = inject(SeasonStore),
  playerStore = inject(PlayerStore),
  service = inject(RacesService),
) => {
  const player$ = toObservable(playerStore.player).pipe(truthy());
  const logoff$ = toObservable(playerStore.unauthorized).pipe(truthy());
  return actions$.pipe(
    ofType(RacesActions.loadBids),
    concatMap(() => combineLatest([
      seasonFacade.season$,
      facade.selectedRace$,
      player$,
    ]).pipe(
      debounceTime(200),
      switchMap(([season, race, player]) => service.getBids(season.id, race, player.uid)),
      map(bids => RacesActions.loadBidsSuccess({ bids })),
      catchError(error => {
        const permissionError = error.code === 'permission-denied';
        return of(permissionError ? RacesActions.loadBidsSuccess({ bids: [] }) : RacesActions.loadBidsFailure({ error }));
      }),
      takeUntil(merge(actions$.pipe(ofType(RacesActions.loadBids)), logoff$)),
    )));

}, { functional: true });

export const loadParticipants$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  seasonFacade = inject(SeasonStore),
  service = inject(RacesService),
  playerStore = inject(PlayerStore),
) => {
  const logoff$ = toObservable(playerStore.unauthorized).pipe(truthy());
  return actions$.pipe(
    ofType(RacesActions.loadParticipants),
    concatMap(() => combineLatest([
      seasonFacade.season$,
      facade.selectedRace$,
    ]).pipe(
      debounceTime(200),
      switchMap(([season, race]) => service.getParticipants(season.id, race)),
      map(participants => RacesActions.loadParticipantsSuccess({ participants })),
      catchError(error => of(RacesActions.loadParticipantsFailure({ error }))),
      takeUntil(merge(actions$.pipe(ofType(RacesActions.loadParticipants)), logoff$)),
    )));

}, { functional: true });

export const loadBid$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  seasonFacade = inject(SeasonStore),
  service = inject(RacesService),
  playerStore = inject(PlayerStore),
) => {
  const logoff$ = toObservable(playerStore.unauthorized).pipe(truthy());
  return actions$.pipe(
    ofType(RacesActions.loadBid),
    concatMap(({ uid }) => combineLatest([
      seasonFacade.season$,
      facade.selectedRace$,
    ]).pipe(
      debounceTime(200),
      switchMap(([season, race]) => service.getBid(season.id, race.round, uid)),
      map(bid => RacesActions.loadBidSuccess({ bid })),
      catchError(error => of(RacesActions.loadBidFailure({ error }))),
      takeUntil(merge(actions$.pipe(ofType(RacesActions.loadBid)), logoff$)))));

}, { functional: true });

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

export const submitBid$ = createEffect((
  actions$ = inject(Actions),
  playerStore = inject(PlayerStore),
  service = inject(RacesService),
) => {
  const player$ = toObservable(playerStore.player).pipe(truthy());
  return actions$.pipe(
    ofType(RacesActions.submitBid),
    concatMap(({ bid }) => player$.pipe(
      first(),
      switchMap(player => service.submitBid(bid, player)
        .then(() => RacesActions.submitBidSuccess())
        .catch(error => RacesActions.submitBidFailure({ error })),
      )),
    ));

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

export const rollbackResult$ = createEffect((
  actions$ = inject(Actions),
  service = inject(RacesService),
) => {
  return actions$.pipe(
    ofType(RacesActions.rollbackResult),
    concatMap(({ round }) => service.rollbackResult(round)
      .then(() => RacesActions.rollbackResultSuccess())
      .catch(error => RacesActions.rollbackResultFailure({ error })),
    ));

}, { functional: true });

export const cancelRace$ = createEffect((
  actions$ = inject(Actions),
  service = inject(RacesService),
) => {
  return actions$.pipe(
    ofType(RacesActions.cancelRace),
    concatMap(({ round }) => service.cancelRace(round)
      .then(() => RacesActions.cancelRaceSuccess())
      .catch(error => RacesActions.cancelRaceFailure({ error })),
    ));

}, { functional: true });

export const updateBid$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  seasonFacade = inject(SeasonStore),
  playerStore = inject(PlayerStore),
  service = inject(RacesService),
) => {
  const player$ = toObservable(playerStore.player).pipe(truthy());
  return actions$.pipe(
    ofType(RacesActions.updateYourBid),
    concatMap(({ bid }) => combineLatest([
      seasonFacade.season$,
      facade.selectedRace$,
      player$,
    ]).pipe(
      first(),
      switchMap(([season, race, player]) => service.updateBid(season.id, race.round, player, bid)),
      map(() => RacesActions.updateYourBidSuccess()),
      catchError(error => of(RacesActions.updateYourBidFailure({ error }))),
    )));

}, { functional: true });

export const loadLastYear$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  service = inject(RacesService),
) => {
  return actions$.pipe(
    ofType(RacesActions.loadLastYear),
    withLatestFrom(facade.lastYear$),
    concatMap(([_, lastYear]) => lastYear
      ? of(RacesActions.loadLastYearSuccess({ result: lastYear }))
      : facade.allRaces$.pipe(
        map(races => races.find(r => r.state === 'open' || r.state === 'closed')),
        filter(race => !!race),
        switchMap(race => service.getLastYearResult(race.season, race.countryCode)),
        map(result => RacesActions.loadLastYearSuccess({ result })),
        first(),
      )));

}, { functional: true });

