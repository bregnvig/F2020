import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, OnInit, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Params } from '@angular/router';
import { PlayersStore } from '@f2020/api';
import { Player } from '@f2020/data';
import { first, map, switchMap } from 'rxjs/operators';
import { DepositDialogComponent } from '../deposit-dialog/deposit-dialog.component';
import { TransactionsComponent } from '../transactions/transactions.component';
import { TransferDialogComponent } from './../transfer-dialog/transfer-dialog.component';
import { WithdrawDialogComponent } from './../withdraw-dialog/withdraw-dialog.component';

@Component({
  selector: 'f2020-player-transactions',
  template: `
    @if (player()) {
      <mat-toolbar color="primary">
        <span class="flex-auto">{{ player().displayName }}</span><span>{{ player().balance | currency: 'DKK' }}</span>
      </mat-toolbar>
    }
    <f2020-transactions [player]="player()"></f2020-transactions>
    @if (player()) {
      <mat-toolbar class="fixed bottom-0 flex flex-row">
        <button class="my-auto flex-auto" mat-button (click)="openDeposit(player())">Indsæt</button>
        <button class="my-auto flex-auto" mat-button (click)="openWithdraw(player())">Hæv</button>
        <button class="my-auto flex-auto" mat-button (click)="openTransfer(player())">Overfør</button>
      </mat-toolbar>
    }
    `,
  standalone: true,
  imports: [MatToolbarModule, TransactionsComponent, MatButtonModule, MatDialogModule, AsyncPipe, CurrencyPipe],
})
export class PlayerTransactionsComponent implements OnInit {

  player: Signal<Player>;

  constructor(
    private store: PlayersStore,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.route.params.pipe(
      map<Params, string>(params => params.uid),
    ).subscribe(uid => this.store.setPlayer(uid));
    this.player = this.store.player;
  }

  openDeposit(player: Player) {
    this.dialog.open(DepositDialogComponent, {
      width: '250px',
      data: { player },
    }).afterClosed().pipe(
      switchMap(result => result),
      first(),
    ).subscribe(amount => this.snackBar.open(`${player.displayName} har fået indsat ${amount}`, null, { duration: 3000 }));
  }

  openWithdraw(player: Player) {
    this.dialog.open(WithdrawDialogComponent, {
      width: '250px',
      data: { player },
    }).afterClosed().pipe(
      switchMap(result => result),
      first(),
    ).subscribe(amount => this.snackBar.open(`${player.displayName} har fået udbetalt ${amount}`, null, { duration: 3000 }));
  }

  openTransfer(player: Player) {
    this.dialog.open(TransferDialogComponent, {
      data: { player },
    }).afterClosed().pipe(
      switchMap(result => result),
      first(),
    ).subscribe(({ amount, to }: {
      amount: number,
      to: Player;
    }) => this.snackBar.open(`${player.displayName} har overført ${amount} til ${to.displayName}`, null, { duration: 3000 }));
  }
}
