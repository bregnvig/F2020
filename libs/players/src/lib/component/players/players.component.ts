import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlayersStore } from '@f2020/api';

@Component({
    selector: 'f2020-players',
    template: `
    <router-outlet/>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterOutlet],
    providers: [PlayersStore]
})
export class PlayersComponent {

  constructor() {
    inject(PlayersStore).loadPlayers();
  }
}
