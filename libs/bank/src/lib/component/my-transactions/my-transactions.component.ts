import { AsyncPipe, CurrencyPipe, NgIf } from '@angular/common';
import { Component, OnInit, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PlayerStore } from '@f2020/api';
import { Player } from '@f2020/data';
import { icon } from '@f2020/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TransactionsComponent } from '../transactions/transactions.component';
import { DepositInfoDialogComponent } from './deposit-info-dialog/deposit-info-dialog.component';

@UntilDestroy()
@Component({
  selector: 'f2020-my-transactions',
  template: `
    <div class="flex flex-col h-full">
      <mat-toolbar color="primary">
        <span class="flex-auto">Saldo</span>
        <span *ngIf="player()">{{ player().balance | currency: 'DKK' }}</span>
      </mat-toolbar>
      <f2020-transactions class="flex-auto" [player]="player()"></f2020-transactions>
      <button mat-fab aria-label="Indsæt penge" color="primary" (click)="showInfo()">
        <fa-icon [icon]="icon" size="lg"></fa-icon>
      </button>
    </div>
  `,
  styleUrls: ['./my-transactions.component.scss'],
  standalone: true,
  imports: [MatToolbarModule, NgIf, MatButtonModule, MatDialogModule, FontAwesomeModule, TransactionsComponent, AsyncPipe, CurrencyPipe],
})
export class MyTransactionsComponent implements OnInit {

  player: Signal<Player>;
  icon = icon.farPiggyBank;

  constructor(private store: PlayerStore, private dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.player = this.store.player;
  }

  showInfo() {
    this.dialog.open(DepositInfoDialogComponent);
  }
}
