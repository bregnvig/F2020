import { AsyncPipe, CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, inject, Signal } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { PlayersStore } from '@f2020/api';
import { Player } from '@f2020/data';
import { LoadingComponent } from '@f2020/shared';

@Component({
  selector: 'f2020-accounts-list',
  templateUrl: './accounts-list.component.html',
  standalone: true,
  imports: [MatToolbarModule, MatListModule, RouterLink, LoadingComponent, AsyncPipe, CurrencyPipe, NgOptimizedImage],
})
export class AccountsListComponent {

  players: Signal<Player[]> = inject(PlayersStore).players;

}
