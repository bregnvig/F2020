import { Injectable, Signal } from '@angular/core';
import { Player } from '@f2020/data';
import { Store } from '@f2020/shared';
import { PlayersApiService } from '../service/players-api.service';

export interface PlayersState {
  players?: Player[];
  selectedId?: string | number; // which Players record has been selected
  loaded: boolean; // has the Players list been loaded
  error?: string | null; // last none error (if any)
}

const initialState: PlayersState = {
  // set initial required properties
  loaded: false,
};

@Injectable()
export class PlayersStore extends Store<PlayersState> {

  constructor(private service: PlayersApiService) {
    super(initialState);
  }

  loadPlayers() {
    if (!this.loaded()) {
      this.service.getPlayers().subscribe({
        next: players => {
          this.setState(() => ({ players, loaded: true }));
        },
        error: error => {
          console.error(error);
          this.setState(() => ({ error: error['message'] ?? error, loaded: false }));
        },
      });
    }
  }

  setPlayer(uid: string) {
    this.setState(() => ({ selectedId: uid }));
  }

  get players(): Signal<Player[]> {
    return this.select(state => state.players);
  }

  get loaded(): Signal<boolean> {
    return this.select(state => state.loaded);
  }

  get player(): Signal<Player | undefined> {
    return this.select(state => state.players?.find(p => p.uid === state.selectedId));
  }
}
