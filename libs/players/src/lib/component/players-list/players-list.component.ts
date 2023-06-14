import { truthy } from '@f2020/tools';
import { Observable } from 'rxjs';
import { PlayersFacade } from '@f2020/api';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Player } from '@f2020/data';
import { map } from 'rxjs/operators';
import { icon } from '@f2020/shared';
import { LoadingComponent } from '../../../../../shared/src/lib/component/loading/loading.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
    templateUrl: './players-list.component.html',
    styleUrls: ['./players-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatToolbarModule, NgIf, MatListModule, NgFor, RouterLink, FontAwesomeModule, LoadingComponent, AsyncPipe]
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
