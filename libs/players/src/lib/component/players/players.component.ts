import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlayersStore } from '@f2020/api';

@Component({
  selector: 'f2020-players',
  template: `
    <router-outlet></router-outlet>`,
  standalone: true,
  imports: [RouterOutlet],
  providers: [PlayersStore],
})
export class PlayersComponent {

  constructor(store: PlayersStore) {
    store.loadPlayers();
  }
}
