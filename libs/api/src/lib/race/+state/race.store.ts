import { computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Bid, IRace, Participant } from '@f2020/data';
import { truthy } from '@f2020/tools';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { DateTime } from 'luxon';
import { combineLatest, distinctUntilChanged, firstValueFrom, pipe, switchMap, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { DriversStore } from '../../drivers';
import { PlayerStore } from '../../player';
import { SeasonStore } from '../../season/+state';
import { TeamService } from '../../service';
import { RacesService } from '../service/races.service';
import { buildResult } from '../service/result-builder';
import { RacesStore } from './races.store';

export interface RaceState {
  race: IRace | undefined;
  bids: Participant[] | Bid[] | undefined;
  bid?: Bid;
  interimResult: Partial<Bid> | undefined;
  result: Bid | undefined;
  loaded: boolean; // has the Races list been loaded
  error?: string | undefined; // last none error (if any)
}

const initialState: RaceState = {
  loaded: false,
  race: undefined,
  bids: undefined,
  interimResult: undefined,
  result: undefined,
  error: undefined,
};

// @ts-ignore
export const RaceStore = signalStore(
  withState(initialState),
  withMethods((
    store,
    service = inject(RacesService),
    racesStore = inject(RacesStore),
    races$ = toObservable(inject(RacesStore).races),
    playerStore = inject(PlayerStore),
    seasonStore = inject(SeasonStore),
    driversStore = inject(DriversStore),
    teamsService = inject(TeamService),
    snackBar = inject(MatSnackBar),
  ) => ({
    loadRace: rxMethod<string>(
      pipe(
        distinctUntilChanged(),
        tap(() => patchState(store, { loaded: false })),
        switchMap(round => races$.pipe(
          map(races => races?.find(r => r.round.toString(10) === round)),
        )),
        truthy(),
        switchMap(race => {
          const player = playerStore.player();
          const unauthorized = playerStore.unauthorized();
          if (!unauthorized && race) {
            const hasPlayedCurrentRace = racesStore.yourBid()?.submitted;
            const closed = race.close < DateTime.now();
            const season = seasonStore.season();
            return ((closed || hasPlayedCurrentRace)
              ? service.getBids(season.id, race, player.uid)
              : service.getParticipants(season.id, race)).pipe(
                tapResponse({
                  next: bids => patchState(store, { race, bids, loaded: true, error: undefined }),
                  error: error => patchState(store, { error: error?.toString() }),
                }),
              );
          }
        }),
      ),
    ),
    loadResult: async (): Promise<void> => {
      const race = store.race();
      if (race) {
        const offset = racesStore.races().filter(r => r.round < race.round && r.state === 'cancelled').length;
        const result = await firstValueFrom(teamsService.teams$.pipe(
          switchMap(teams => combineLatest([
            service.getResult(race.season, race.round - offset),
            service.getQualify(race.season, race.round - offset),
            service.getPitStops(race.season, race.round - offset, driversStore.drivers(), teams),
          ])),
          map(([raceResult, qualify, pitStops]) => {
            return buildResult(raceResult, qualify, pitStops, race.selectedDriver, race.selectedTeam);
          }),
        ));
        patchState(store, { result });
      }
    },
    updateDrivers: (drivers: string[]) => service.updateRace(seasonStore.season().id, store.race().round, { drivers }),
    updateBid: (bid: Bid) => {
      if (bid && seasonStore.season() && playerStore.player()) {
        return service.updateBid(seasonStore.season().id, store.race().round, playerStore.player(), bid);
      }
      return Promise.resolve();
    },
    submitBid: (bid: Bid) => service.submitBid(bid, playerStore.player()),
    submitResult: (result: Bid) => service.submitResult(store.race().round, result),
    submitInterimResult: (result: Bid) => service.submitInterimResult(result),
    rollback: () => service.rollbackResult(store.race().round).then(() => snackBar.open(`✔ Resultat for ${store.race().name} er blevet rullet tilbage`, null, { duration: 3000 })),
    cancel: () => service.cancelRace(store.race().round).then(() => snackBar.open(`✔ ${store.race().name} er blevet aflyst`, null, { duration: 3000 })),
    update: (race: IRace) => service.updateRaceV2(race).then(() => snackBar.open(`✔ ${race.name} er blevet opdateret`, null, { duration: 3000 })),
  }),
  ),
  withComputed((
    { bids },
    playerStore = inject(PlayerStore),
  ) => ({
    bid: computed(() => bids()?.find(bid => bid.player.uid === playerStore.player()?.uid)) as any,
  })),
);

