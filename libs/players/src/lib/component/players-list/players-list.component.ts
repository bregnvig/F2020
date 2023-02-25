import { truthy } from '@f2020/tools';
import { Observable } from 'rxjs';
import { PlayersFacade } from '@f2020/api';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Player } from '@f2020/data';
import { map } from 'rxjs/operators';
import { icon } from '@f2020/shared';

@Component({
  templateUrl: './players-list.component.html',
  styleUrls: ['./players-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayersListComponent implements OnInit {

  players$: Observable<Player[]>;
  icon = icon;

  constructor(private facade: PlayersFacade) { }

  ngOnInit(): void {
    this.players$ = this.facade.allPlayers$.pipe(
      truthy(),
      map(players => players.filter(p => !p.roles.includes('bookie')))
    );
  }

  isAnonymous(player: Player): boolean {
    return player.roles.length === 1 && player.roles[0] === 'anonymous';
  }

  isPlayer(player: Player): boolean {
    return player.roles.indexOf('player') !== -1;
  }

  isAdmin(player: Player): boolean {
    return player.roles.indexOf('admin') !== -1;
  }

  isBankAdmin(player: Player): boolean {
    return player.roles.indexOf('bank-admin') !== -1;
  }
}
