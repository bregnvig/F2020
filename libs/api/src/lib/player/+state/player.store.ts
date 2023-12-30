import { Player } from '@f2020/data';
import { Store } from '@f2020/shared';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { getMessaging, getToken } from 'firebase/messaging';
import { first } from 'rxjs/operators';
import { Injectable, Signal } from '@angular/core';
import { PlayerApiService } from '../service/player-api.service';
import { filterEquals } from '@f2020/tools';

export interface PlayerState {
  player?: Player;
  unauthorized?: boolean;
  authorized?: boolean;
  loading: boolean;
  loaded: boolean;
  updatingWBC: boolean;
  error?: any;
}

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class PlayerStore extends Store<PlayerState> {

  readonly authorized: Signal<boolean> = this.select(state => state.authorized);
  readonly player = this.select(state => state.player);
  readonly error = this.select(state => state.error);
  readonly loading = this.select(state => state.loading);
  readonly unauthorized = this.select(state => state.unauthorized);
  readonly updatingWBC = this.select(state => state.updatingWBC);

  constructor(private service: PlayerApiService) {
    super({
      loading: false,
      loaded: false,
      updatingWBC: false,
    });
    service.player$.pipe(
      filterEquals(),
      untilDestroyed(this),
    ).subscribe({
      next: player => this.setState(() => ({
        player,
        loaded: true,
        loading: false,
        unauthorized: false,
        authorized: true,
      })),
      error: error => this.setState(() => ({ error, loaded: false, loading: false })),
    });
  }

  loadMessaging() {
    return getToken(getMessaging())
      .then(token => !this.player().tokens?.some(t => t === token) && this.updatePlayer({ tokens: [token] }))
      .catch(error => this.setState(() => ({ error })));
  }

  updatePlayer(partialPlayer: Partial<Player>) {
    this.service.updatePlayer(partialPlayer).pipe(
      first(),
    ).subscribe({
      next: () => this.setState(state => ({ player: { ...state.player, ...partialPlayer } })),
      error: error => this.setState(() => ({ error })),
    });
  }

  logout() {
    return this.service.signOut().then(
      () => this.setState(() => ({ player: null, authorized: false, unauthorized: true })),
      error => this.setState(() => ({ error })),
    );
  }

  joinWBC() {
    this.setState(() => ({ updatingWBC: true }));
    return this.service.joinWBC().then(() => this.setState(() => ({ updatingWBC: false })));
  }

  undoWBC() {
    this.setState(() => ({ updatingWBC: true }));
    return this.service.undoWBC().then(() => this.setState(() => ({ updatingWBC: false })));
  }
}
