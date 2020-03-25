import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { fetch } from '@nrwl/angular';
import { combineLatest, of } from 'rxjs';
import { catchError, concatMap, filter, map, startWith, switchMap, takeUntil, first } from 'rxjs/operators';
import { SeasonFacade } from '../../season/+state/season.facade';
import { RacesService } from '../service/races.service';
import { environment } from './../../../environments/environment';
import { PlayerFacade } from './../../player/+state/player.facade';
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
            takeUntil(this.actions$.pipe(ofType(RacesActions.loadRaces))),
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

  loadBid$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.loadBid),
    concatMap(() => combineLatest([
      this.seasonFacade.season$, 
      this.facade.selectedRace$, 
      this.playerFacade.player$
    ]).pipe(
        takeUntil(this.actions$.pipe(ofType(RacesActions.loadBid))),
        switchMap(([season, race, player]) => this.service.getBid(season.id, race.location.country, player.uid)),
        startWith(environment.initialBid),
        filter(bid => !!bid),
        map(bid => RacesActions.loadBidSuccess({ bid })),
        catchError(error => of(RacesActions.loadBidFailure({ error }))),
      ),
    )
  ));


  loadBids$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.loadBids),
    concatMap(() => combineLatest([
      this.seasonFacade.season$, 
      this.facade.selectedRace$, 
    ]).pipe(
        takeUntil(this.actions$.pipe(ofType(RacesActions.loadBids))),
        switchMap(([season, race]) => this.service.getBids(season.id, race.location.country)),
        map(bids => RacesActions.loadBidsSuccess({ bids })),
        catchError(error => of(RacesActions.loadBidFailure({ error }))),
      ),
    )
  ));


  updateBid$ = createEffect(() => this.actions$.pipe(
    ofType(RacesActions.updateBid),
    concatMap(({bid}) => combineLatest([
      this.seasonFacade.season$, 
      this.facade.selectedRace$, 
      this.playerFacade.player$
    ]).pipe(
      first(),
      switchMap(([season, race, player]) => this.service.updateBid(season.id, race.location.country, player, bid)),
      catchError(error => of(RacesActions.updateBidFailure({ error }))),
    ))
  ), {dispatch: false});

  constructor(
    private actions$: Actions, 
    private service: RacesService, 
    private facade: RacesFacade,
    private playerFacade: PlayerFacade,
    private seasonFacade: SeasonFacade) {
  }
}
