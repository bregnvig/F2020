import { Inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { converter, Transaction } from '@f2020/data';
import { GoogleFunctions } from '@f2020/firebase';
import firebase from 'firebase/compat/app';
import 'firebase/firestore';
import { DateTime } from 'luxon';
import { Observable } from 'rxjs';


@Injectable()
export class AccountService {

  static readonly transactionsURL = 'transactions';

  constructor(private afs: AngularFirestore,
    @Inject(GoogleFunctions) private functions: firebase.functions.Functions) { }

  async deposit(uid: string, amount: number, message: string): Promise<true> {
    return this.functions.httpsCallable('deposit')({ amount, message, uid }).then(() => true);
  }

  async withdraw(uid: string, amount: number, message: string): Promise<true> {
    return this.functions.httpsCallable('withdraw')({ amount, message, uid }).then(() => true);
  }

  async transfer(fromUid: string, toUid: string, amount: number, message: string): Promise<true> {
    return this.functions.httpsCallable('transfer')({ fromUid, toUid, message, amount }).then(() => true);
  }

  getTransactions(uid: string, start: DateTime, numberOfTransactions: number): Observable<Transaction[]> {
    return this.afs.collection<Transaction>(AccountService.transactionsURL, ref => ref
      .where('involved', 'array-contains', uid)
      .where('date', '<', firebase.firestore.Timestamp.fromDate(start.toJSDate()))
      .orderBy('date', 'desc')
      .limit(numberOfTransactions)
      .withConverter(converter.transaction)
    ).valueChanges();
  }
}
