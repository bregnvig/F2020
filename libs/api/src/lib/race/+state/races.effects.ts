import { buildResult } from './../service/result-builder';
import { Injectable } from '@angular/core';
import { PlayerActions, PlayerFacade } from '@f2020/player';
import { truthy } from '@f2020/tools';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { fetch } from '@nrwl/angular';
import { combineLatest, of } from 'rxjs';
import { catchError, concatMap, debounceTime, first, map, switchMap, takeUntil, tap, withLatestFrom, filter } from 'rxjs/operators';
import { SeasonFacade } from '../../season/+state/season.facade';
import { RacesService } from '../service/races.service';
import { RacesActions } from './races.actions';
import { RacesFacade } from './races.facade';

@Injectable()
export class RacesEffects {
  loadRaces$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RacesActions.loadRaces),
      fetch({
        run: action => {
          return this.seasonFacade.season$.pipe(
            takeUntil(this.actions$.pipe(ofType(RacesActions.loadRaces, PlayerActions.logoutPlayer))),
            switchMap(season => this.service.getRaces(season.id)),
            map(races => RacesActions.loadRacesSuccess({ races })),
          );
        },
        onError: (action, error) => {
          console.error('Error', error);
          return RacesActions.loadRacesFailure({ error });
        },
      }),
    ),
  );

  loadYourBid$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.loadYourBid),
    concatMap(() => combineLatest([
      this.seasonFacade.season$,
      this.facade.selectedRace$,
      this.playerFacade.player$,
    ]).pipe(
      switchMap(([season, race, player]) => this.service.getBid(season.id, race.round, player.uid)),
      map(bid => bid || {}),
      map(bid => RacesActions.loadYourBidSuccess({ bid })),
      catchError(error => of(RacesActions.loadYourBidFailure({ error }))),
      takeUntil(this.actions$.pipe(ofType(RacesActions.loadYourBid, PlayerActions.logoutPlayer))),
    ),
    )
  ));


  loadBids$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.loadBids),
    concatMap(() => combineLatest([
      this.seasonFacade.season$,
      this.facade.selectedRace$,
      this.facade.yourBid$.pipe(map(bid => bid && !!bid.submitted)),
    ]).pipe(
      debounceTime(200),
      switchMap(([season, race, submitted]) => submitted ? this.service.getBids(season.id, race.round) : of([])),
      map(bids => RacesActions.loadBidsSuccess({ bids })),
      catchError(error => {
        const permissionError = error.code === 'permission-denied'
        return of(permissionError ? RacesActions.loadBidsSuccess({ bids: [] }) : RacesActions.loadBidsFailure({ error }));
      }),
      takeUntil(this.actions$.pipe(ofType(RacesActions.loadBids, PlayerActions.logoutPlayer))),
    ))
  ));

  loadBid$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.loadBid),
    concatMap(({ uid }) => combineLatest([
      this.seasonFacade.season$,
      this.facade.selectedRace$,
    ]).pipe(
      debounceTime(200),
      switchMap(([season, race]) => this.service.getBid(season.id, race.round, uid)),
      map(bid => RacesActions.loadBidSuccess({ bid })),
      catchError(error => of(RacesActions.loadBidFailure({ error }))),
      takeUntil(this.actions$.pipe(ofType(RacesActions.loadBid, PlayerActions.logoutPlayer))),
    ))
  ));

  loadResult$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.loadResult),
    concatMap(() => this.facade.selectedRace$.pipe(
      debounceTime(200),
      truthy(),
      switchMap(race => combineLatest([
        this.service.getResult(race.season, race.round),
        this.service.getQualify(race.season, race.round),
        of(race.selectedDriver),
      ])),
      map(([race, qualify, selectedDriver]) => {
        const result = buildResult(race, qualify, selectedDriver);
        return RacesActions.loadResultSuccess({ result })
      }),
      first(),
      catchError(error => of(RacesActions.loadResultFailure({ error }))),
    ))
  ));

  submitBid$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.submitBid),
    concatMap(({ bid }) => this.service.submitBid(bid)
      .then(() => RacesActions.submitBidSuccess())
      .catch(error => RacesActions.submitBidFailure({ error }))
    )
  ));

  submitResult$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.submitResult),
    concatMap(() => this.facade.result$.pipe(
      switchMap(result => this.service.submitResult(result)
        .then(() => RacesActions.submitResultSuccess())
        .catch(error => RacesActions.submitResultFailure({ error }))
      ))
    )
  ));

  updateBid$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.updateYourBid),
    concatMap(({ bid }) => combineLatest([
      this.seasonFacade.season$,
      this.facade.selectedRace$,
      this.playerFacade.player$
    ]).pipe(
      first(),
      switchMap(( [season, race, player]) => this.service.updateBid(season.id, race.round, player, bid)),
      map(() => RacesActions.updateYourBidSuccess()),
      catchError(error => of(RacesActions.updateYourBidFailure({ error }))),
    ))
  ));
  
  updateRaceDrivers$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.updateRaceDrivers),
    concatMap(({ drivers }) => combineLatest([
      this.seasonFacade.season$,
      this.facade.selectedRace$,
    ]).pipe(
      first(),
      switchMap(([season, race]) => this.service.updateRace(season.id, race.round, {drivers})),
      map(() => RacesActions.updateRaceDriversSuccess()),
      catchError(error => of(RacesActions.updateRaceDriversFailure({ error }))),
    ))
  ));

  constructor(
    private actions$: Actions,
    private service: RacesService,
    private facade: RacesFacade,
    private playerFacade: PlayerFacade,
    private seasonFacade: SeasonFacade) {
  }
}
