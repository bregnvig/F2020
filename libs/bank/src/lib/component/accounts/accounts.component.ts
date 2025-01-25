import { Component, inject } from '@angular/core';
import { PlayersStore } from '@f2020/api';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'f2020-accounts',
    template: '<router-outlet/>',
    imports: [RouterOutlet],
    providers: [PlayersStore]
})
export class AccountsComponent {

  constructor() {
    inject(PlayersStore).loadPlayers();
  }
}
