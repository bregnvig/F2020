import { inject } from '@angular/core';
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

export const loadRaces$ = createEffect((
  actions$ = inject(Actions),
  seasonFacade = inject(SeasonFacade),
  service = inject(RacesService),
) =>
  actions$.pipe(
    ofType(RacesActions.loadRaces),
    concatMap(() => seasonFacade.season$.pipe(
      switchMap(season => service.getRaces(season.id)),
      map(races => RacesActions.loadRacesSuccess({ races })),
      catchError(error => of(RacesActions.loadRacesFailure({ error }))),
      takeUntil(actions$.pipe(ofType(RacesActions.loadRaces, PlayerActions.logoutPlayer))),
    ))
  ),
  { functional: true }
);

export const loadYourBid$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  seasonFacade = inject(SeasonFacade),
  playerFacade = inject(PlayerFacade),
  service = inject(RacesService),
) => actions$.pipe(
  ofType(RacesActions.loadYourBid, RacesActions.loadYourBidFromLanding),
  concatMap(() => combineLatest([
    seasonFacade.season$,
    facade.currentRace$,
    playerFacade.player$,
  ]).pipe(
    filter(([season, race, player]) => !!race),
    switchMap(([season, race, player]) => service.getBid(season.id, race.round, player.uid)),
    map(bid => bid || {}),
    map(bid => RacesActions.loadYourBidSuccess({ bid })),
    catchError(error => of(RacesActions.loadYourBidFailure({ error }))),
    takeUntil(actions$.pipe(ofType(RacesActions.loadYourBid, PlayerActions.logoutPlayer))),
  ))),
  { functional: true }
);

export const loadBids$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  seasonFacade = inject(SeasonFacade),
  playerFacade = inject(PlayerFacade),
  service = inject(RacesService),
) => actions$.pipe(
  ofType(RacesActions.loadBids),
  concatMap(() => combineLatest([
    seasonFacade.season$,
    facade.selectedRace$,
    playerFacade.player$,
  ]).pipe(
    debounceTime(200),
    switchMap(([season, race, player]) => service.getBids(season.id, race, player.uid)),
    map(bids => RacesActions.loadBidsSuccess({ bids })),
    catchError(error => {
      const permissionError = error.code === 'permission-denied';
      return of(permissionError ? RacesActions.loadBidsSuccess({ bids: [] }) : RacesActions.loadBidsFailure({ error }));
    }),
    takeUntil(actions$.pipe(ofType(RacesActions.loadBids, PlayerActions.logoutPlayer))),
  ))),
  { functional: true }
);

export const loadParticipants$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  seasonFacade = inject(SeasonFacade),
  service = inject(RacesService),
) => actions$.pipe(
  ofType(RacesActions.loadParticipants),
  concatMap(() => combineLatest([
    seasonFacade.season$,
    facade.selectedRace$,
  ]).pipe(
    debounceTime(200),
    switchMap(([season, race]) => service.getParticipants(season.id, race)),
    map(participants => RacesActions.loadParticipantsSuccess({ participants })),
    catchError(error => of(RacesActions.loadParticipantsFailure({ error }))),
    takeUntil(actions$.pipe(ofType(RacesActions.loadParticipants, PlayerActions.logoutPlayer))),
  ))),
  { functional: true }
);

export const loadBid$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  seasonFacade = inject(SeasonFacade),
  service = inject(RacesService),
) => actions$.pipe(
  ofType(RacesActions.loadBid),
  concatMap(({ uid }) => combineLatest([
    seasonFacade.season$,
    facade.selectedRace$,
  ]).pipe(
    debounceTime(200),
    switchMap(([season, race]) => service.getBid(season.id, race.round, uid)),
    map(bid => RacesActions.loadBidSuccess({ bid })),
    catchError(error => of(RacesActions.loadBidFailure({ error }))),
    takeUntil(actions$.pipe(ofType(RacesActions.loadBid, PlayerActions.logoutPlayer))),
  ))),
  { functional: true }
);

export const loadResult$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  driversFacade = inject(DriversFacade),
  service = inject(RacesService),
  teamsService = inject(TeamService),
) => actions$.pipe(
  ofType(RacesActions.loadResult),
  withLatestFrom(driversFacade.allDriver$, teamsService.teams$, facade.allRaces$),
  concatMap(([, drivers, teams, races]) => facade.selectedRace$.pipe(
    debounceTime(200),
    truthy(),
    switchMap(race => {
      const offset = races.filter(r => r.round < race.round && r.state === 'cancelled').length;
      return combineLatest([
        service.getResult(race.season, race.round - offset),
        service.getQualify(race.season, race.round - offset),
        service.getPitStops(race.season, race.round - offset, drivers, teams),
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
  ))),
  { functional: true }
);

export const loadInterimResult$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  service = inject(RacesService),
) => actions$.pipe(
  ofType(RacesActions.loadInterimResult),
  concatMap(() => facade.selectedRace$.pipe(
    debounceTime(200),
    truthy(),
    switchMap(race => combineLatest([
      service.getQualify(race.season, race.round),
      of(race.selectedDriver),
      of(race.selectedTeam)
    ])),
    map(([qualify, selectedDriver, selectedTeam]) => {
      const result = buildInterimResult(qualify, selectedDriver, selectedTeam);
      return RacesActions.loadInterimResultSuccess({ result });
    }),
    first(),
    catchError(error => of(RacesActions.loadInterimResultFailure({ error }))),
  ))),
  { functional: true }
);

export const updateRace$ = createEffect((
  actions$ = inject(Actions),
  service = inject(RacesService),
) => actions$.pipe(
  ofType(RacesActions.updateRace),
  concatMap(({ race }) => service.updateRaceV2(race)
    .then(() => RacesActions.submitBidSuccess())
    .catch(error => RacesActions.submitBidFailure({ error }))
  )),
  { functional: true }
);

export const submitBid$ = createEffect((
  actions$ = inject(Actions),
  playerFacade = inject(PlayerFacade),
  service = inject(RacesService),
) => actions$.pipe(
  ofType(RacesActions.submitBid),
  concatMap(({ bid }) => playerFacade.player$.pipe(
    first(),
    switchMap(player => service.submitBid(bid, player)
      .then(() => RacesActions.submitBidSuccess())
      .catch(error => RacesActions.submitBidFailure({ error }))
    ))
  )),
  { functional: true }
);

export const submitResult$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  service = inject(RacesService),
) => actions$.pipe(
  ofType(RacesActions.submitResult),
  withLatestFrom(facade.selectedRace$),
  concatMap(([, race]) => facade.result$.pipe(
    switchMap(result => service.submitResult(race.round, result)
      .then(() => RacesActions.submitResultSuccess())
      .catch(error => RacesActions.submitResultFailure({ error }))
    ),
    first()),
  )),
  { functional: true }
);

export const submitInterimResult$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  service = inject(RacesService),
) => actions$.pipe(
  ofType(RacesActions.submitInterimResult),
  concatMap(() => facade.interimResult$.pipe(
    switchMap(result => service.submitInterimResult(result)
      .then(() => RacesActions.submitInterimResultSuccess())
      .catch(error => RacesActions.submitInterimResultFailure({ error }))
    ))
  )),
  { functional: true }
);

export const rollbackResult$ = createEffect((
  actions$ = inject(Actions),
  service = inject(RacesService),
) => actions$.pipe(
  ofType(RacesActions.rollbackResult),
  concatMap(({ round }) => service.rollbackResult(round)
    .then(() => RacesActions.rollbackResultSuccess())
    .catch(error => RacesActions.rollbackResultFailure({ error }))
  )),
  { functional: true }
);

export const cancelRace$ = createEffect((
  actions$ = inject(Actions),
  service = inject(RacesService),
) => actions$.pipe(
  ofType(RacesActions.cancelRace),
  concatMap(({ round }) => service.cancelRace(round)
    .then(() => RacesActions.cancelRaceSuccess())
    .catch(error => RacesActions.cancelRaceFailure({ error }))
  )),
  { functional: true }
);

export const updateBid$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  seasonFacade = inject(SeasonFacade),
  playerFacade = inject(PlayerFacade),
  service = inject(RacesService),
) => actions$.pipe(
  ofType(RacesActions.updateYourBid),
  concatMap(({ bid }) => combineLatest([
    seasonFacade.season$,
    facade.selectedRace$,
    playerFacade.player$
  ]).pipe(
    first(),
    switchMap(([season, race, player]) => service.updateBid(season.id, race.round, player, bid)),
    map(() => RacesActions.updateYourBidSuccess()),
    catchError(error => of(RacesActions.updateYourBidFailure({ error }))),
  ))),
  { functional: true }
);

export const updateRaceDrivers$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  seasonFacade = inject(SeasonFacade),
  service = inject(RacesService),
) => actions$.pipe(
  ofType(RacesActions.updateRaceDrivers),
  concatMap(({ drivers }) => combineLatest([
    seasonFacade.season$,
    facade.selectedRace$,
  ]).pipe(
    first(),
    switchMap(([season, race]) => service.updateRace(season.id, race.round, { drivers })),
    map(() => RacesActions.updateRaceDriversSuccess()),
    catchError(error => of(RacesActions.updateRaceDriversFailure({ error }))),
  ))),
  { functional: true }
);

export const loadLastYear$ = createEffect((
  actions$ = inject(Actions),
  facade = inject(RacesFacade),
  service = inject(RacesService),
) => actions$.pipe(
  ofType(RacesActions.loadLastYear),
  withLatestFrom(facade.lastYear$),
  concatMap(([_, lastYear]) => lastYear
    ? of(RacesActions.loadLastYearSuccess({ result: lastYear }))
    : facade.allRaces$.pipe(
      map(races => races.find(r => r.state === 'open' || r.state === 'closed')),
      filter(race => !!race),
      switchMap(race => service.getLastYearResult(race.season, race.countryCode)),
      map(result => RacesActions.loadLastYearSuccess({ result })),
      first()
    ))),
  { functional: true }
);
