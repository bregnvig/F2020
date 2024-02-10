import { computed, Injectable, Signal } from '@angular/core';
import { Player } from '@f2020/data';
import { PlayersApiService } from '../service/players-api.service';
import { Store } from '../../store';

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

  players = this.state.players;
  loaded = this.state.loaded;
  player: Signal<Player | undefined> = computed(() => this.state.players().find(p => p.uid === this.state.selectedId()));

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
}
