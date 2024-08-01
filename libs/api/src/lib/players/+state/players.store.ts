import { computed, inject } from '@angular/core';
import { Player } from '@f2020/data';
import { PlayersApiService } from '../service/players-api.service';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';

export interface PlayersState {
  players: Player[] | undefined;
  selectedId: string | number | undefined; // which Players record has been selected
  loaded: boolean; // has the Players list been loaded
  error: string | undefined; // last none error (if any)
}

const initialState: PlayersState = {
  // set initial required properties
  loaded: false,
  players: undefined,
  selectedId: undefined,
  error: undefined,
};

export const PlayersStore = signalStore(
  withState(initialState),
  withMethods((store, service = inject(PlayersApiService)) => ({
    setPlayer: (uid: string) => patchState(store, { selectedId: uid }),
    loadPlayers: rxMethod<void>(
      pipe(
        tap(() => patchState(store, ({ loaded: false }))),
        switchMap(() => service.getPlayers().pipe(
          tapResponse({
            next: players => patchState(store, { players, loaded: true }),
            error: error => patchState(store, { error: error['message'] ?? error, loaded: false }),
          }),
        )),
      ),
    ),
  })),
  withComputed(({ players, selectedId }) => ({
    player: computed(() => players()?.find(p => p.uid === selectedId())),
  })),
);
