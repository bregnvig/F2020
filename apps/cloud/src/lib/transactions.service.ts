import { Transaction as MoneyTransaction } from '@f2020/data';
import { firestore } from 'firebase-admin';
import { Transaction } from 'firebase-admin/firestore';
import { DateTime } from 'luxon';
import { firestoreUtils } from './firestore-utils';

// export transaction = (transaction)

export const transferInTransaction = ({ date, amount, message, from, to }: MoneyTransaction, transaction: Transaction): Transaction => {
  const db = firestore();
  const transactions = db.collection('transactions');

  return transaction.create(transactions.doc(), firestoreUtils.convertDateTimes(<MoneyTransaction>{
    date: date || DateTime.local(),
    amount,
    message,
    from: from ?? null,
    to: to ?? null,
    involved: [from, to].filter(Boolean),
  }));
};

export const transfer = (bankTransaction: MoneyTransaction): Promise<void> => {
  const db = firestore();
  return db.runTransaction(transaction => {
    transferInTransaction(bankTransaction, transaction);
    return Promise.resolve();
  });
};
