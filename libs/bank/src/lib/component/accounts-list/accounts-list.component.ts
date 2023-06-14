import { Observable } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { PlayersFacade } from '@f2020/api';
import { Player } from '@f2020/data';
import { LoadingComponent } from '../../../../../shared/src/lib/component/loading/loading.component';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { NgIf, NgFor, AsyncPipe, CurrencyPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
    selector: 'f2020-accounts-list',
    templateUrl: './accounts-list.component.html',
    styleUrls: ['./accounts-list.component.scss'],
    standalone: true,
    imports: [MatToolbarModule, NgIf, MatListModule, NgFor, RouterLink, LoadingComponent, AsyncPipe, CurrencyPipe]
})
export class AccountsListComponent implements OnInit {

  players$: Observable<Player[]>

  constructor(private facade: PlayersFacade) { }

  ngOnInit(): void {
    this.players$ = this.facade.allPlayers$;
  }

}
