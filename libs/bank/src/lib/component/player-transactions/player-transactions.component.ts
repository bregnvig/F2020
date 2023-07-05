import { AsyncPipe, CurrencyPipe, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Params } from '@angular/router';
import { PlayersActions, PlayersFacade } from '@f2020/api';
import { Player } from '@f2020/data';
import { truthy } from '@f2020/tools';
import { Observable } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';
import { DepositDialogComponent } from '../deposit-dialog/deposit-dialog.component';
import { TransactionsComponent } from '../transactions/transactions.component';
import { TransferDialogComponent } from './../transfer-dialog/transfer-dialog.component';
import { WithdrawDialogComponent } from './../withdraw-dialog/withdraw-dialog.component';

@Component({
  selector: 'f2020-player-transactions',
  template: `
  <mat-toolbar color="primary" *ngIf="player$ | async as player">
    <span class="flex-auto">{{player?.displayName}}</span><span>{{player?.balance | currency: 'DKK'}}</span>
  </mat-toolbar>
  <f2020-transactions [player]="player$ | async"></f2020-transactions>
  <mat-toolbar class="fixed bottom-0 flex flex-row" *ngIf="player$ | async as player">
    <button class="my-auto flex-auto" mat-button (click)="openDeposit(player)">Indsæt</button>
    <button class="my-auto flex-auto" mat-button (click)="openWithdraw(player)">Hæv</button>
    <button class="my-auto flex-auto" mat-button (click)="openTransfer(player)">Overfør</button>
  </mat-toolbar>
  `,
  standalone: true,
  imports: [NgIf, MatToolbarModule, TransactionsComponent, MatButtonModule, MatDialogModule, AsyncPipe, CurrencyPipe]
})
export class PlayerTransactionsComponent implements OnInit {

  player$: Observable<Player>;

  constructor(
    private facade: PlayersFacade,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.pipe(
      map<Params, string>(params => params.uid),
    ).subscribe(uid => this.facade.dispatch(PlayersActions.selectPlayer({ uid })));
    this.player$ = this.facade.selectedPlayer$.pipe(
      truthy(),
    );
  }

  openDeposit(player: Player) {
    this.dialog.open(DepositDialogComponent, {
      width: '250px',
      data: { player }
    }).afterClosed().pipe(
      switchMap(result => result),
      first()
    ).subscribe(amount => this.snackBar.open(`${player.displayName} har fået indsat ${amount}`, null, { duration: 3000 }));
  }

  openWithdraw(player: Player) {
    this.dialog.open(WithdrawDialogComponent, {
      width: '250px',
      data: { player }
    }).afterClosed().pipe(
      switchMap(result => result),
      first()
    ).subscribe(amount => this.snackBar.open(`${player.displayName} har fået udbetalt ${amount}`, null, { duration: 3000 }));
  }

  openTransfer(player: Player) {
    this.dialog.open(TransferDialogComponent, {
      data: { player }
    }).afterClosed().pipe(
      switchMap(result => result),
      first()
    ).subscribe(({ amount, to }: { amount: number, to: Player; }) => this.snackBar.open(`${player.displayName} har overført ${amount} til ${to.displayName}`, null, { duration: 3000 }));
  }
}
