import { DepositInfoDialogComponent } from './deposit-info-dialog/deposit-info-dialog.component';
import { Component, OnInit } from '@angular/core';
import { Player } from '@f2020/data';
import { PlayerFacade } from '@f2020/api';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AbstractSuperComponent } from '@f2020/shared';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'f2020-my-transactions',
  template: `
  <mat-toolbar color="primary">
    <span fxFlex>Saldo</span>
    <ng-container *ngIf="player$ | async as player">
      <button mat-icon-button (click)="showInfo()"><mat-icon fontSet="far" fontIcon="fa-piggy-bank"></mat-icon></button>
      <span>{{player.balance | currency: 'DKK'}}</span>
    </ng-container>
  </mat-toolbar>
  <f2020-transactions fxFlex [player]="player$ | async"></f2020-transactions>
  `,
  styleUrls: ['./my-transactions.component.scss']
})
export class MyTransactionsComponent extends AbstractSuperComponent implements OnInit {

  player$: Observable<Player>;

  constructor(private facade: PlayerFacade, private dialog: MatDialog) {
    super();
  }

  ngOnInit(): void {
    this.player$ = this.facade.player$.pipe(
      filter(player => !!player),
      this.takeUntilDestroyed(),
    );
  }

  showInfo() {
    this.dialog.open(DepositInfoDialogComponent);
  }
}
