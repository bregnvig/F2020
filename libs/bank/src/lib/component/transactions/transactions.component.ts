import { Component, Input } from '@angular/core';
import { Player, Transaction } from '@f2020/data';
import { DateTime } from 'luxon';
import { BehaviorSubject, distinctUntilChanged, Observable, switchMap, tap } from 'rxjs';
import { AccountService } from '../../service';

@Component({
  selector: 'f2020-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent {

  transactions$: Observable<Transaction[]>;
  private _player: Player;
  private lastDate$ = new BehaviorSubject<DateTime>(DateTime.local());

  constructor(private service: AccountService) { }


  @Input() set player(value: Player) {
    if (value && this._player?.uid !== value?.uid) {
      this._player = value;
      // this.dataSource = new TransactionsDataSource(value.uid, this.service)
      this.transactions$ = this.lastDate$.pipe(
        distinctUntilChanged((a, b) => a.toMillis() === b.toMillis()),
        tap(_ => console.log(_)),
        switchMap(lastDate => this.service.getTransactions(value.uid, lastDate, 20))
      );
      // ).subscribe(res => {
      //   this.cached = this.cached.concat(res);
      //   this.dataStream.next(this.cached);
      //   this.lastDate = res[res.length - 1]?.date;
      // });
    }
  }

  get player(): Player {
    return this._player;
  }

  amount(transaction: Transaction): number {
    return transaction.to === this.player.uid ? transaction.amount : - transaction.amount;
  }
  loadMore(transaction: Transaction) {
    console.log('MORE!!!');
    this.lastDate$.next(transaction.date);
  }
}
