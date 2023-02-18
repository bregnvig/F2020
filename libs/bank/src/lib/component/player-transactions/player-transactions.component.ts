import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Player } from '@f2020/data';
import { PlayersActions, PlayersFacade } from '@f2020/api';
import { truthy } from '@f2020/tools';
import { Observable } from 'rxjs';
import { first, pluck, switchMap } from 'rxjs/operators';
import { DepositDialogComponent } from '../deposit-dialog/deposit-dialog.component';
import { TransferDialogComponent } from './../transfer-dialog/transfer-dialog.component';
import { WithdrawDialogComponent } from './../withdraw-dialog/withdraw-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'f2020-player-transactions',
  template: `
  <mat-toolbar color="primary" *ngIf="player$ | async as player">
    <span fxFlex>{{player?.displayName}}</span><span>{{player?.balance | currency: 'DKK'}}</span>
  </mat-toolbar>
  <f2020-transactions fxFlex [player]="player$ | async"></f2020-transactions>
  <mat-toolbar fxLayoutAlign="space-between" *ngIf="player$ | async as player">
    <button mat-button fxFlex (click)="openDeposit(player)">Indsæt</button>
    <button mat-button fxFlex (click)="openWithdraw(player)">Hæv</button>
    <button mat-button fxFlex (click)="openTransfer(player)">Overfør</button>
  </mat-toolbar>
  `
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
      pluck<Params, string>('uid')
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
