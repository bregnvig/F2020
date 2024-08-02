import { Player } from '@f2020/data';
import { getMessaging, getToken } from 'firebase/messaging';
import { inject } from '@angular/core';
import { PlayerApiService } from '../service/player-api.service';
import { filterEquals } from '@f2020/tools';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface PlayerState {
  player: Player | undefined;
  unauthorized: boolean | undefined;
  authorized: boolean | undefined;
  loading: boolean;
  loaded: boolean;
  updatingWBC: boolean;
  error: any | undefined;
}

export const PlayerStore = signalStore(
  { providedIn: 'root' },
  withState<PlayerState>({
    player: undefined,
    unauthorized: undefined,
    authorized: undefined,
    loading: false,
    loaded: false,
    updatingWBC: false,
    error: undefined,
  }),
  withMethods((store, service = inject(PlayerApiService)) => ({
      async updatePlayer(partialPlayer: Partial<Player>) {
        firstValueFrom(service.updatePlayer(partialPlayer)).then(
          () => patchState(store, ({ player: { ...this.player(), ...partialPlayer } })),
          error => patchState(store, { error }),
        );
      },
      async logout() {
        return service.signOut().then(
          () => patchState(store, { player: null, authorized: false, unauthorized: true }),
          error => patchState(store, { error }),
        );
      },
      async loadMessaging() {
        return getToken(getMessaging())
          .then(token => !store.player().tokens?.some(t => t === token) && this.updatePlayer({ tokens: [token] }))
          .catch(error => this.setState(() => ({ error })));
      },
      async joinWBC() {
        patchState(store, { updatingWBC: true });
        await this.service.joinWBC();
        patchState(store, { updatingWBC: false });
      },
      async undoWBC() {
        patchState(store, { updatingWBC: true });
        await service.undoWBC();
        patchState(store, { updatingWBC: false });
      },
    }),
  ),

  withHooks({
    onInit(store) {
      inject(PlayerApiService).player$.pipe(
        filterEquals(),
        takeUntilDestroyed(),
      ).subscribe({
        next: player => patchState(store, {
          player,
          loaded: true,
          loading: false,
          unauthorized: !player,
          authorized: !!player,
        }),
        error: error => patchState(store, { error, loaded: false, loading: false }),
      });
    },
  }),
);
