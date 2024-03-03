import { PlayersStore } from '@f2020/api';
import { ChangeDetectionStrategy, Component, computed, OnInit, Signal } from '@angular/core';
import { Player } from '@f2020/data';
import { icon, LoadingComponent } from '@f2020/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { AsyncPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  templateUrl: './players-list.component.html',
  styleUrls: ['./players-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatToolbarModule, MatListModule, RouterLink, FontAwesomeModule, LoadingComponent, AsyncPipe],
})
export class PlayersListComponent implements OnInit {

  players: Signal<Player[]>;
  icon = icon;

  constructor(private store: PlayersStore) {
  }

  ngOnInit(): void {
    this.players = computed(() => (this.store.players() ?? []).filter(p => !p.roles.includes('bookie')));
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
