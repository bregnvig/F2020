import { internalError, validateAccess } from '../../lib';
import { documentPaths } from '../../lib/paths';
import { getFirestore } from 'firebase-admin/firestore';
import { CallableRequest, onCall } from 'firebase-functions/v2/https';

interface BalanceData {
  uid: string;
  balance: number;
}

export const manualBalance = onCall(async (request: CallableRequest<BalanceData>) => {

  return validateAccess(request.auth?.uid, 'bank-admin')
    .then(() => updateBalance(request.data))
    .then(() => true)
    .catch(internalError);
});

const updateBalance = async ({ uid, balance }: BalanceData) => {
  const db = getFirestore();
  return db.doc(documentPaths.player(uid)).update({ balance });
};
