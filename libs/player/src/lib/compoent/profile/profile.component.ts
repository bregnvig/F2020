import { Component, OnInit } from '@angular/core';
import { MatSelectionListChange } from '@angular/material/list';
import { PlayerActions, PlayerFacade, PlayersActions, PlayersFacade } from '@f2020/api';
import { Player } from '@f2020/data';
import { truthy } from '@f2020/tools';
import { combineLatest, Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

@Component({
  selector: 'f2020-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  receiveReminders$: Observable<boolean>;
  player$: Observable<Player>;
  players$: Observable<[Player, boolean][]>;

  constructor(private facade: PlayerFacade, private playersFacade: PlayersFacade) {
  }

  ngOnInit(): void {
    this.playersFacade.dispatch(PlayersActions.loadPlayers());

    this.player$ = this.facade.player$.pipe(truthy());
    this.players$ = combineLatest([this.player$, this.playersFacade.allPlayers$.pipe(truthy())]).pipe(
      first(),
      map(([player, players]) => players.filter(p => p.uid !== player.uid).map(p => [p, !player.receiveBettingStarted || player.receiveBettingStarted.includes(p.uid)])),
    );
    this.receiveReminders$ = this.player$.pipe(
      truthy(),
      map(player => player.receiveReminders ?? true)
    );
  }

  selectionChanged(change: MatSelectionListChange) {
    const receiveBettingStarted: string[] = change.source.selectedOptions.selected.map(s => s.value);
    this.facade.dispatch(PlayerActions.updatePlayer({ partialPlayer: { receiveBettingStarted } }));

  }

  updateReceiveReminders(receiveReminders: boolean) {
    this.facade.dispatch(PlayerActions.updatePlayer({ partialPlayer: { receiveReminders } }));
  }

}
