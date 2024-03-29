import { Player } from '@f2020/data';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { getMessaging, getToken } from 'firebase/messaging';
import { first } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { PlayerApiService } from '../service/player-api.service';
import { filterEquals } from '@f2020/tools';
import { Store } from '../../store';

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

  readonly authorized = this.state.authorized;
  readonly player = this.state.player;
  readonly error = this.state.error;
  readonly loading = this.state.loading;
  readonly unauthorized = this.state.unauthorized;
  readonly updatingWBC = this.state.updatingWBC;

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
        unauthorized: !player,
        authorized: !!player,
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
      next: () => this.setState(() => ({ player: { ...this.player(), ...partialPlayer } })),
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
