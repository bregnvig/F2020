import { transfer } from './../../lib/transactions.service';
import { logAndCreateError, validateAccess } from "../../lib";
import * as functions from 'firebase-functions';
import { DateTime } from 'luxon';

interface DepositData {
  amount: number;
  message: string;
  uid: string;
}

export const deposit = functions.region('europe-west1').https.onCall(async (data: DepositData, context) => {
  return validateAccess(context.auth?.uid, 'bank-admin')
    .then(player => buildDeposit(data))
    .then(() => true)
    .catch(errorMessage => {
      throw logAndCreateError('internal', errorMessage)
    });
});

const buildDeposit = async ({ uid, amount, message }: DepositData) => {
  if (!amount) {
    throw logAndCreateError('not-found', `No amount specified for uid: ${uid} `);
  }
  if (!uid) {
    throw logAndCreateError('not-found', `No uid specified for request `);
  }

  return transfer({
    date: DateTime.local(),
    amount: amount,
    message: message,
    to: uid
  })
}
