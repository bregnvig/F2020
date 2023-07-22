import { AsyncPipe, CurrencyPipe, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PlayerFacade } from '@f2020/api';
import { Player } from '@f2020/data';
import { icon } from '@f2020/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TransactionsComponent } from '../transactions/transactions.component';
import { DepositInfoDialogComponent } from './deposit-info-dialog/deposit-info-dialog.component';

@UntilDestroy()
@Component({
  selector: 'f2020-my-transactions',
  template: `
  <div class="flex flex-col h-full">
    <mat-toolbar color="primary">
      <span class="flex-auto">Saldo</span>
      <span *ngIf="player$ | async as player">{{player.balance | currency: 'DKK'}}</span>
    </mat-toolbar>
    <f2020-transactions class="flex-auto" [player]="player$ | async"></f2020-transactions>
    <button mat-fab aria-label="Indsæt penge" color="primary" (click)="showInfo()">
      <fa-icon [icon]="icon" size="lg"></fa-icon>
    </button>
  </div>
  `,
  styleUrls: ['./my-transactions.component.scss'],
  standalone: true,
  imports: [MatToolbarModule, NgIf, MatButtonModule, MatDialogModule, FontAwesomeModule, TransactionsComponent, AsyncPipe, CurrencyPipe]
})
export class MyTransactionsComponent implements OnInit {

  player$: Observable<Player>;
  icon = icon.farPiggyBank;

  constructor(private facade: PlayerFacade, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.player$ = this.facade.player$.pipe(
      filter(player => !!player),
      untilDestroyed(this),
    );
  }

  showInfo() {
    this.dialog.open(DepositInfoDialogComponent);
  }
}
