import { Player, Transaction } from '@f2020/data';
import { DocumentReference, getFirestore } from 'firebase-admin/firestore';
import { region } from 'firebase-functions/v1';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { logAndCreateError } from './../../lib/firestore-utils';
import { log } from 'firebase-functions/logger';
import { documentPaths } from '../../lib';

const playerURL = (uid: string) => documentPaths.player(uid);

export const balanceTrigger = region('europe-west1').firestore.document('transactions/{transactionId}')
  .onCreate(async (snapshot: DocumentSnapshot) => {
    const db = getFirestore();
    const transaction: Transaction | undefined = snapshot.data() as Transaction;
    const from = transaction.from ? db.doc(playerURL(transaction.from)) as DocumentReference<Player> : null;
    const to = transaction.to ? db.doc(playerURL(transaction.to)) as DocumentReference<Player> : null;

    return db.runTransaction(async firestoreTransaction => {
      if (from) {
        const ref = (await from.get());
        // TODO This should be deleted, when everything is migrated
        if (!ref.exists && isNaN(<any>transaction.from)) {
          throw logAndCreateError('not-found', `From uid: ${transaction.from} was not found`);
        } else if (ref.exists) {
          const player = ref.data()!;
          log(`Withdrawing ${transaction.amount.toFixed(2)} from ${player.displayName}`);
          firestoreTransaction.update(from, { balance: (player.balance || 0) - transaction.amount });
        } else {
          log('From non migrated user', transaction.from);
        }
      }
      if (to) {
        const ref = (await to.get());
        if (!ref.exists && isNaN(<any>transaction.to)) {
          throw logAndCreateError('not-found', `To uid: ${transaction.to} was not found`);
        } else if (ref.exists) {
          const player = ref.data()!;
          log(`Depositing ${transaction.amount.toFixed(2)} to ${player.displayName}`);
          firestoreTransaction.update(to, { balance: (player.balance || 0) + transaction.amount });
        } else {
          log('To non migrated user', transaction.to);
        }
      }
      return Promise.resolve(true);
    })
      .catch(error => logAndCreateError('internal', error));
  });
