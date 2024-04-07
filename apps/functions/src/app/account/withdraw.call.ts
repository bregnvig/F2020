import { DateTime } from 'luxon';
import { getUser, internalError, logAndCreateError, PlayerImpl, validateAccess } from '../../lib';
import { transfer } from '../../lib/transactions.service';
import { CallableRequest, onCall } from 'firebase-functions/v2/https';

const validateBalance = (player: PlayerImpl, amount: number): void => {
  if ((player.balance || 0) - amount < 0) {
    throw logAndCreateError('failed-precondition', `${player.displayName} has insufficient funds to withdraw ${amount}. Balance: ${(player.balance || 0).toFixed(2)}`);
  }
};

interface WithdrawData {
  amount: number;
  message: string;
  uid: string;
}

export const withdraw = onCall(async (request: CallableRequest<WithdrawData>) => {
  return validateAccess(request.auth?.uid, 'bank-admin')
    .then(() => buildWithdraw(request.data))
    .then(() => true)
    .catch(internalError);
});

const buildWithdraw = async ({ uid, amount, message }: WithdrawData) => {

  if (!uid) {
    throw logAndCreateError('not-found', `No uid specified for request `);
  }
  const player = await getUser(uid);
  if (!player) {
    throw logAndCreateError('not-found', `No player with uid: ${uid} not found`);
  }
  if (!amount) {
    throw logAndCreateError('failed-precondition', `No amount specified for player: ${player.displayName} `);
  }
  if (amount < 0) {
    throw logAndCreateError('failed-precondition', `Negative amount specified for player: ${player.displayName} `);
  }
  validateBalance(player, amount);

  return transfer({
    date: DateTime.local(),
    amount: amount,
    message: message,
    from: uid,
    involved: [uid],
  });
};
