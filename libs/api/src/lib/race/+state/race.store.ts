import { computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Bid, IDriver, IRace, Participant } from '@f2020/data';
import { truthy } from '@f2020/tools';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { DateTime } from 'luxon';
import { combineLatest, distinctUntilChanged, firstValueFrom, of, OperatorFunction, pipe, switchMap, tap } from 'rxjs';
import { catchError, filter, map } from 'rxjs/operators';
import { DriversStore } from '../../drivers';
import { PlayerStore } from '../../player';
import { SeasonStore } from '../../season/+state';
import { TeamService } from '../../service';
import { RacesService } from '../service/races.service';
import { buildInterimResult, buildResult } from '../service/result-builder';
import { RacesStore } from './races.store';

export interface RaceState {
  race: IRace | undefined;
  bids: Participant[] | Bid[] | undefined;
  bid?: Bid;
  drivers?: IDriver[];
  interimResult: Partial<Bid> | undefined;
  result: Bid | undefined;
  loaded: boolean; // has the Races list been loaded
  error?: unknown | undefined; // last none error (if any)
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
  withComputed((
    { bids, race },
    playerStore = inject(PlayerStore),
    driversStore = inject(DriversStore),
  ) => ({
    bid: computed(() => bids()?.find(bid => bid.player.uid === playerStore.player()?.uid)) as any,
    drivers: computed(() => driversStore?.drivers()?.filter(driver => race()?.drivers.includes(driver.driverId))) as any ?? [],
  })),
  withMethods((
      store,
      service = inject(RacesService),
      racesStore = inject(RacesStore),
      races$ = toObservable(inject(RacesStore).races),
      playerStore = inject(PlayerStore),
      seasonStore = inject(SeasonStore),
      teamsService = inject(TeamService),
      snackBar = inject(MatSnackBar),
    ) => ({
      loadRace: rxMethod<string>(
        pipe(
          filter(() => !playerStore.unauthorized()),
          distinctUntilChanged(),
          tap(() => patchState(store, { loaded: false })),
          switchMap(round => races$.pipe(
            map(races => races?.find(r => r.round.toString(10) === round)),
          )),
          truthy(),
          map(race => {
            const closed = race.close < DateTime.now();
            return {
              race,
              type: closed ? 'closed' : racesStore.yourBid()?.submitted ? 'bids' : 'participants',
            };
          }),
          switchMap(({ race, type }) => {
            const season = seasonStore.season();
            return ((type === 'participants')
              ? service.getParticipants(season.id, race)
              : service.getBids(season.id, race).pipe(
                map(bids => bids.filter(bid => type !== 'closed' || bid.submitted)),
              )).pipe(
              tapResponse({
                next: bids => patchState(store, { race, bids, loaded: true, error: undefined }),
                error: error => patchState(store, { error: error?.toString() }),
              }),
            );
          }),
        ),
      ),
      loadResult: async (): Promise<void> => {
        const reportError = <T>(): OperatorFunction<T, T | null> =>
          catchError(error => {
            console.error(error);
            patchState(store, { error });
            return of(null);
          });
        const race = store.race();
        if (race) {
          const result = await firstValueFrom(teamsService.teams$.pipe(
            switchMap(teams => combineLatest([
              service.getResult(race, store.drivers()).pipe(reportError()),
              service.getQualify(race, store.drivers()).pipe(reportError()),
              service.getPitStops(race, store.drivers(), teams).pipe(reportError()),
            ])),
            map(([raceResult, qualify, pitStops]) => {
              return buildResult(raceResult, qualify, pitStops, race.selectedDriver, race.selectedTeam);
            }),
          )).catch(error => {
            console.error(error);
            patchState(store, { error });
          });
          result && patchState(store, { result });
        }
      },
      loadInterimResult: async (): Promise<void> => {
        const race = store.race();
        if (race) {
          const interimResult = await firstValueFrom(service.getQualify(race, store.drivers()).pipe(
            map(qualify => buildInterimResult(qualify, race.selectedDriver, race.selectedTeam)),
          )).catch(error => patchState(store, { error, loaded: true }));
          interimResult && patchState(store, { interimResult });
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
      standings: () => service.updateStandings(store.race()).then(() => snackBar.open(`✔ Køre resultat for ${store.race().name} er blevet opdateret`, null, { duration: 3000 })),
      cancel: () => service.cancelRace(store.race().round).then(() => snackBar.open(`✔ ${store.race().name} er blevet aflyst`, null, { duration: 3000 })),
      update: (race: IRace) => service.updateRaceV2(race).then(() => snackBar.open(`✔ ${race.name} er blevet opdateret`, null, { duration: 3000 })),
    }),
  ),
);

