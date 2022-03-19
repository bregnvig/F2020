import { Inject, Injectable } from '@angular/core';
import { collection, collectionData, Firestore, limit, orderBy, query, where } from '@angular/fire/firestore';
import { converter, Transaction } from '@f2020/data';
import { GoogleFunctions } from '@f2020/firebase';
import { Timestamp } from 'firebase/firestore';
import { Functions, httpsCallable } from 'firebase/functions';
import { DateTime } from 'luxon';
import { Observable } from 'rxjs';


@Injectable()
export class AccountService {

  static readonly transactionsURL = 'transactions';

  constructor(
    private afs: Firestore,
    @Inject(GoogleFunctions) private functions: Functions) {

  }

  async deposit(uid: string, amount: number, message: string): Promise<true> {
    return httpsCallable(this.functions, 'deposit')({ amount, message, uid }).then(() => true);
  }

  async withdraw(uid: string, amount: number, message: string): Promise<true> {
    return httpsCallable(this.functions, 'withdraw')({ amount, message, uid }).then(() => true);
  }

  async transfer(fromUid: string, toUid: string, amount: number, message: string): Promise<true> {
    return httpsCallable(this.functions, 'transfer')({ fromUid, toUid, message, amount }).then(() => true);
  }

  getTransactions(uid: string, start: DateTime, numberOfTransactions: number): Observable<Transaction[]> {

    const transactionQuery = query(
      collection(this.afs, AccountService.transactionsURL).withConverter(converter.transaction),
      where('involved', 'array-contains', uid),
      where('date', '<', Timestamp.fromDate(start.toJSDate())),
      orderBy('date', 'desc'),
      limit(numberOfTransactions),
    );
    return collectionData(transactionQuery);
  }
}
