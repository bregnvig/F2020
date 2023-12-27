import { Component } from '@angular/core';
import { PlayersStore } from '@f2020/api';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'f2020-accounts',
  template: '<router-outlet></router-outlet>',
  standalone: true,
  imports: [RouterOutlet],
  providers: [PlayersStore],
})
export class AccountsComponent {

  constructor(store: PlayersStore) {
    store.loadPlayers();
  }
}
