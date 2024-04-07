import { DateTime } from 'luxon';
import { internalError, logAndCreateError, validateAccess } from '../../lib';
import { transfer } from '../../lib/transactions.service';
import { CallableRequest, onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';

// TODO Move to main.ts when error is fixed
setGlobalOptions({
  region: 'europe-west1',
});

interface DepositData {
  amount: number;
  message: string;
  uid: string;
}

export const deposit = onCall((request: CallableRequest<DepositData>) => {
  return validateAccess(request.auth?.uid, 'bank-admin')
    .then(() => buildDeposit(request.data))
    .then(() => true)
    .catch(internalError);
});

const buildDeposit = async ({ uid, amount, message }: DepositData) => {
  if (!uid) {
    throw logAndCreateError('not-found', `No uid specified for request `);
  }
  if (!amount) {
    throw logAndCreateError('failed-precondition', `No amount specified for uid: ${uid} `);
  }

  if (amount < 0) {
    throw logAndCreateError('failed-precondition', `Amount specified is negative. Amount: ${amount.toFixed(2)} specified for uid: ${uid} `);
  }

  return transfer({
    date: DateTime.local(),
    amount: amount,
    message: message,
    to: uid,
    involved: [uid],
  });
};
