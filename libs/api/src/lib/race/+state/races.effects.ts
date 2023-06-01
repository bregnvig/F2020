import { Injectable } from '@angular/core';
import { DriversFacade } from '@f2020/driver';
import { truthy } from '@f2020/tools';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { combineLatest, of } from 'rxjs';
import { catchError, concatMap, debounceTime, filter, first, map, switchMap, takeUntil, withLatestFrom } from 'rxjs/operators';
import { PlayerActions, PlayerFacade } from '../../player';
import { SeasonFacade } from '../../season/+state/season.facade';
import { TeamService } from '../../service';
import { RacesService } from '../service/races.service';
import { buildInterimResult, buildResult } from './../service/result-builder';
import { RacesActions } from './races.actions';
import { RacesFacade } from './races.facade';

@Injectable()
export class RacesEffects {
  loadRaces$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RacesActions.loadRaces),
      concatMap(() => this.seasonFacade.season$.pipe(
        switchMap(season => this.service.getRaces(season.id)),
        map(races => RacesActions.loadRacesSuccess({ races })),
        catchError(error => of(RacesActions.loadRacesFailure({ error }))),
        takeUntil(this.actions$.pipe(ofType(RacesActions.loadRaces, PlayerActions.logoutPlayer))),
      ))
    )
  );

  loadYourBid$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.loadYourBid, RacesActions.loadYourBidFromLanding),
    concatMap(() => combineLatest([
      this.seasonFacade.season$,
      this.facade.currentRace$,
      this.playerFacade.player$,
    ]).pipe(
      filter(([season, race, player]) => !!race),
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
      this.playerFacade.player$,
    ]).pipe(
      debounceTime(200),
      switchMap(([season, race, player]) => this.service.getBids(season.id, race, player.uid)),
      map(bids => RacesActions.loadBidsSuccess({ bids })),
      catchError(error => {
        const permissionError = error.code === 'permission-denied';
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
    withLatestFrom(this.driversFacade.allDriver$, this.teamsService.teams$, this.facade.allRaces$),
    concatMap(([, drivers, teams, races]) => this.facade.selectedRace$.pipe(
      debounceTime(200),
      truthy(),
      switchMap(race => {
        const offset = races.filter(r => r.round < race.round && r.state === 'cancelled').length;
        return combineLatest([
          this.service.getResult(race.season, race.round - offset),
          this.service.getQualify(race.season, race.round - offset),
          this.service.getPitStops(race.season, race.round - offset, drivers, teams),
          of(race.selectedDriver),
          of(race.selectedTeam)
        ]);
      }),
      map(([raceResult, qualify, pitStops, selectedDriver, selectedTeam]) => {
        const result = buildResult(raceResult, qualify, pitStops, selectedDriver, selectedTeam);
        return RacesActions.loadResultSuccess({ result });
      }),
      first(),
      catchError(error => of(RacesActions.loadResultFailure({ error }))),
    ))
  ));

  loadInterimResult$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.loadInterimResult),
    concatMap(() => this.facade.selectedRace$.pipe(
      debounceTime(200),
      truthy(),
      switchMap(race => combineLatest([
        this.service.getQualify(race.season, race.round),
        of(race.selectedDriver),
        of(race.selectedTeam)
      ])),
      map(([qualify, selectedDriver, selectedTeam]) => {
        const result = buildInterimResult(qualify, selectedDriver, selectedTeam);
        return RacesActions.loadInterimResultSuccess({ result });
      }),
      first(),
      catchError(error => of(RacesActions.loadInterimResultFailure({ error }))),
    ))
  ));

  updateRace$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.updateRace),
    concatMap(({ race }) => this.service.updateRaceV2(race)
      .then(() => RacesActions.submitBidSuccess())
      .catch(error => RacesActions.submitBidFailure({ error }))
    ))
  );

  submitBid$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.submitBid),
    concatMap(({ bid }) => this.playerFacade.player$.pipe(
      first(),
      switchMap(player => this.service.submitBid(bid, player)
        .then(() => RacesActions.submitBidSuccess())
        .catch(error => RacesActions.submitBidFailure({ error }))
      ))
    )
  ));

  submitResult$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.submitResult),
    withLatestFrom(this.facade.selectedRace$),
    concatMap(([, race]) => this.facade.result$.pipe(
      switchMap(result => this.service.submitResult(race.round, result)
        .then(() => RacesActions.submitResultSuccess())
        .catch(error => RacesActions.submitResultFailure({ error }))
      ),
      first()),
    )
  ));

  submitInterimResult$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.submitInterimResult),
    concatMap(() => this.facade.interimResult$.pipe(
      switchMap(result => this.service.submitInterimResult(result)
        .then(() => RacesActions.submitInterimResultSuccess())
        .catch(error => RacesActions.submitInterimResultFailure({ error }))
      ))
    )
  ));

  rollbackResult$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.rollbackResult),
    concatMap(({ round }) => this.service.rollbackResult(round)
      .then(() => RacesActions.rollbackResultSuccess())
      .catch(error => RacesActions.rollbackResultFailure({ error }))
    ))
  );

  cancelRace$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.cancelRace),
    concatMap(({ round }) => this.service.cancelRace(round)
      .then(() => RacesActions.cancelRaceSuccess())
      .catch(error => RacesActions.cancelRaceFailure({ error }))
    ))
  );

  updateBid$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.updateYourBid),
    concatMap(({ bid }) => combineLatest([
      this.seasonFacade.season$,
      this.facade.selectedRace$,
      this.playerFacade.player$
    ]).pipe(
      first(),
      switchMap(([season, race, player]) => this.service.updateBid(season.id, race.round, player, bid)),
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
      switchMap(([season, race]) => this.service.updateRace(season.id, race.round, { drivers })),
      map(() => RacesActions.updateRaceDriversSuccess()),
      catchError(error => of(RacesActions.updateRaceDriversFailure({ error }))),
    ))
  ));

  loadLastYear$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.loadLastYear),
    withLatestFrom(this.facade.lastYear$),
    concatMap(([_, lastYear]) => lastYear
      ? of(RacesActions.loadLastYearSuccess({ result: lastYear }))
      : this.facade.allRaces$.pipe(
        map(races => races.find(r => r.state === 'open' || r.state === 'closed')),
        filter(race => !!race),
        switchMap(race => this.service.getLastYearResult(race.season, race.countryCode)),
        map(result => RacesActions.loadLastYearSuccess({ result })),
        first()
      ))
  ));

  constructor(
    private actions$: Actions,
    private service: RacesService,
    private teamsService: TeamService,
    private facade: RacesFacade,
    private driversFacade: DriversFacade,
    private playerFacade: PlayerFacade,
    private seasonFacade: SeasonFacade) {
  }
}
