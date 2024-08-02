import { Bid, IRace, RoundResult } from '@f2020/data';
import { computed, inject } from '@angular/core';
import { SeasonStore } from '../../season/+state';
import { RacesService } from '../service/races.service';
import { PlayerStore } from '../../player';
import { combineLatest, distinctUntilChanged, from, of, pipe, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { toObservable } from '@angular/core/rxjs-interop';
import { tapResponse } from '@ngrx/operators';

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

export const RacesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ races }) => ({
    currentRace: computed(() => races()?.find(r => r.state === 'open' || r.state === 'closed')),
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
          return authorized && seasonId
            ? service.getRaces(seasonId).pipe(
              tapResponse({
                next: races => patchState(store, { races, loaded: true, error: undefined }),
                error: error => patchState(store, { error: error?.toString() }),
              }))
            : of();
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
);
