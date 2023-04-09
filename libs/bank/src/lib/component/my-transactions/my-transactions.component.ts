import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PlayerFacade } from '@f2020/api';
import { Player } from '@f2020/data';
import { icon } from '@f2020/shared';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DepositInfoDialogComponent } from './deposit-info-dialog/deposit-info-dialog.component';

@UntilDestroy()
@Component({
  selector: 'f2020-my-transactions',
  template: `
  <div class="flex flex-col h-full">
    <mat-toolbar color="primary">
      <span class="flex-auto">Saldo</span>
      <ng-container *ngIf="player$ | async as player">
        <button mat-icon-button (click)="showInfo()">
          <fa-icon [icon]="icon"></fa-icon>
        </button>
        <span>{{player.balance | currency: 'DKK'}}</span>
      </ng-container>
    </mat-toolbar>
    <f2020-transactions class="flex-auto" [player]="player$ | async"></f2020-transactions>
  </div>
  `,
  styleUrls: ['./my-transactions.component.scss']
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
