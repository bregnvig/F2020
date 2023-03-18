import { Component, Input } from '@angular/core';
import { Player, Transaction } from '@f2020/data';
import { DateTime } from 'luxon';
import { BehaviorSubject, Observable, scan, switchMap } from 'rxjs';
import { AccountService } from '../../service';

@Component({
  selector: 'f2020-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
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
