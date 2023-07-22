import { firestore } from 'firebase-admin';
import { region } from 'firebase-functions/v1';
import { internalError, validateAccess } from '../../lib';
import { documentPaths } from '../../lib/paths';

interface BalanceData {
  uid: string;
  balance: number;
}

export const manualBalance = region('europe-west1').https.onCall(async (data: BalanceData, context) => {

  return validateAccess(context.auth?.uid, 'bank-admin')
    .then(() => updateBalance(data))
    .then(() => true)
    .catch(internalError);
});

const updateBalance = async ({ uid, balance }: BalanceData) => {
  const db = firestore();
  return db.doc(documentPaths.player(uid)).update({ balance });
};
