import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PlayerStore } from '@f2020/api';
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
        @if (player()) {
          <span>{{ player().balance | currency: 'DKK' }}</span>
        }
      </mat-toolbar>
      <f2020-transactions class="flex-auto" [player]="player()"></f2020-transactions>
      <button mat-fab aria-label="Indsæt penge" color="primary" (click)="showInfo()">
        <fa-icon [icon]="icon" size="lg"></fa-icon>
      </button>
    </div>
  `,
  styleUrls: ['./my-transactions.component.scss'],
  imports: [MatToolbarModule, MatButtonModule, MatDialogModule, FontAwesomeModule, TransactionsComponent, CurrencyPipe],
})
export class MyTransactionsComponent {

  player = inject(PlayerStore).player;
  icon = icon.farPiggyBank;

  constructor(private dialog: MatDialog) {
  }

  showInfo() {
    this.dialog.open(DepositInfoDialogComponent);
  }
}
