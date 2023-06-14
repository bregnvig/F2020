import { Component, OnInit, OnDestroy } from '@angular/core';
import { PlayersFacade, PlayersActions } from '@f2020/api';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'f2020-accounts',
    template: '<router-outlet></router-outlet>',
    standalone: true,
    imports: [RouterOutlet],
})
export class AccountsComponent implements OnInit, OnDestroy {

  constructor(private facade: PlayersFacade) { }

  ngOnInit(): void {
    this.facade.dispatch(PlayersActions.loadPlayers());
  }

  ngOnDestroy() {
    this.facade.dispatch(PlayersActions.unloadPlayers());
  }
}
