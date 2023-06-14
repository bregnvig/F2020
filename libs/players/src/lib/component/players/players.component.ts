import { Component, OnInit } from '@angular/core';
import { PlayersFacade, PlayersActions } from '@f2020/api';
import { RouterOutlet } from '@angular/router';

@Component({
    template: `<router-outlet></router-outlet>`,
    standalone: true,
    imports: [RouterOutlet],
})
export class PlayersComponent implements OnInit {

  constructor(private facade: PlayersFacade) { }

  ngOnInit(): void {
    this.facade.dispatch(PlayersActions.loadPlayers());
  }

}
