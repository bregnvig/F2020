import { computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Bid, IRace, RoundResult } from '@f2020/data';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, watchState, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { combineLatest, distinctUntilChanged, from, of, pipe, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { PlayerStore } from '../../player';
import { SeasonStore } from '../../season/+state';
import { RacesService } from '../service/races.service';

interface RacesState {
  races: IRace[] | undefined;
  currentRace?: IRace;
  loaded: boolean; // has the Races list been loaded
  error: string | undefined; // last none error (if any)
  yourBid: Partial<Bid> | undefined;
  lastYear: RoundResult | undefined,
}

const initialState: RacesState = {
  // set initial required properties
  races: undefined,
  loaded: false,
  error: undefined,
  yourBid: undefined,
  lastYear: undefined,
};

const findCurrentRace = (races: IRace[] | undefined): IRace | undefined => races?.find(r => r.state === 'open' || r.state === 'closed');

export const RacesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ races }) => ({
    currentRace: computed(() => findCurrentRace(races())) as any,
  })),
  withMethods((
    store,
    service = inject(RacesService),
    playerStore = inject(PlayerStore),
    authorized$ = toObservable(inject(PlayerStore).authorized).pipe(
      distinctUntilChanged(),
    ),
    seasonId$ = toObservable(inject(SeasonStore).season).pipe(
      map(season => season?.id),
      distinctUntilChanged(),
    ),
  ) => ({
    loadRaces: rxMethod<void>(
      pipe(
        switchMap(() => combineLatest([authorized$, seasonId$])),
        switchMap(([authorized, seasonId]) => {
          if (authorized && seasonId) {

            return service.getRaces(seasonId).pipe(
              tapResponse({
                next: races => patchState(store, { races, loaded: true, error: undefined }),
                error: error => patchState(store, { error: error?.toString() }),
              }),
              map(races => findCurrentRace(races)),
              switchMap(currentRace => currentRace
                ? service.getBid(seasonId, currentRace.round, playerStore.player().uid)
                : of(undefined),
              ),
              tapResponse({
                next: bid => patchState(store, { yourBid: bid }),
                error: error => patchState(store, { error: error?.toString() }),
              }),
            );
          }
          return of();
        }),
      ),
    ),
    loadLastYear: rxMethod<void>(
      pipe(
        switchMap(() => authorized$),
        switchMap(authorized => {
          if (store.lastYear()) return of();
          const race = store.currentRace();
          return (authorized && race
              ? from(service.getLastYearResult(race.season, race.countryCode))
              : of(undefined)
          ).pipe(
            tapResponse({
              next: lastYear => patchState(store, { lastYear }),
              error: error => patchState(store, { error: error?.toString() }),
            }),
          );
        }),
      )),
  })),
  withHooks({
    onInit(store) {
      watchState(store, state => console.log(state, state.currentRace));
    },
  }),
);
