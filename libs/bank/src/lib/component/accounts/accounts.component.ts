import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PlayersStore } from '@f2020/api';
import { RouterOutlet } from '@angular/router';
import { AccountService } from '../../service';

@Component({
  selector: 'f2020-accounts',
  template: '<router-outlet/>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  providers: [PlayersStore, AccountService],
})
export class AccountsComponent {

  constructor() {
    inject(PlayersStore).loadPlayers();
  }
}
