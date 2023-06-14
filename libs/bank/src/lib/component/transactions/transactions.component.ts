import { Component, Input } from '@angular/core';
import { Player, Transaction } from '@f2020/data';
import { DateTime } from 'luxon';
import { BehaviorSubject, Observable, scan, switchMap } from 'rxjs';
import { AccountService } from '../../service';
import { DateTimePipe } from '../../../../../shared/src/lib/pipe/date-time.pipe';
import { LoadingComponent } from '../../../../../shared/src/lib/component/loading/loading.component';
import { MatListModule } from '@angular/material/list';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { NgIf, NgFor, AsyncPipe, CurrencyPipe } from '@angular/common';

@Component({
    selector: 'f2020-transactions',
    templateUrl: './transactions.component.html',
    styleUrls: ['./transactions.component.scss'],
    standalone: true,
    imports: [NgIf, InfiniteScrollModule, MatListModule, NgFor, LoadingComponent, AsyncPipe, CurrencyPipe, DateTimePipe]
})
export class TransactionsComponent {

  transactions$: Observable<Transaction[]>;
  trackByFn = (index: number) => index;
  private _player: Player;
  private lastDate$ = new BehaviorSubject<DateTime>(DateTime.local());

  constructor(private service: AccountService) { }


  @Input() set player(value: Player) {
    if (value && this._player?.uid !== value?.uid) {
      this._player = value;
      this.transactions$ = this.lastDate$.pipe(
        switchMap(lastDate => this.service.getTransactions(value.uid, lastDate, 20)),
        scan((acc, transactions) => [...acc, ...transactions], []),
      );
    }
  }

  get player(): Player {
    return this._player;
  }

  amount(transaction: Transaction): number {
    return transaction.to === this.player.uid ? transaction.amount : - transaction.amount;
  }
  loadMore(transaction: Transaction) {
    this.lastDate$.next(transaction.date);
  }
}
