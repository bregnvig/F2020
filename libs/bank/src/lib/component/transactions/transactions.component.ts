import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import { Player, Transaction } from '@f2020/data';
import { DateTime } from 'luxon';
import { BehaviorSubject, Observable, scan, switchMap } from 'rxjs';
import { AccountService } from '../../service';
import { DateTimePipe, LoadingComponent } from '@f2020/shared';
import { MatListModule } from '@angular/material/list';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { AsyncPipe, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'f2020-transactions',
  templateUrl: './transactions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InfiniteScrollDirective, LoadingComponent, AsyncPipe, CurrencyPipe, DateTimePipe, MatListModule],
})
export class TransactionsComponent {

  transactions$: Observable<Transaction[]>;
  player = input.required<string, Player>({
    transform: value => value?.uid,
  });
  private lastDate$ = new BehaviorSubject<DateTime>(DateTime.local());

  constructor(service: AccountService) {
    effect(() => {
      const player = this.player();
      player && (this.transactions$ = this.lastDate$.pipe(
          switchMap(lastDate => service.getTransactions(player, lastDate, 20)),
          scan((acc, transactions) => [...acc, ...transactions], []),
        )
      );
    });
  }

  amount(transaction: Transaction): number {
    return transaction.to === this.player() ? transaction.amount : -transaction.amount;
  }

  loadMore(transaction: Transaction) {
    this.lastDate$.next(transaction.date);
  }
}
