import { getFirestore } from 'firebase-admin/firestore';
import { beforeEach, describe, expect, it } from 'vitest';
import { createdTrigger } from '../../test/functions';
import { players, readPlayer, writePlayers } from '../../test/fixtures';
import { balanceTrigger } from './balance.trigger';

const createTransaction = async (transaction: { from?: string | null; to?: string | null; amount: number }) => {
  const ref = await getFirestore()
    .collection('transactions')
    .add({ date: new Date(), message: 'Hello', involved: [transaction.from, transaction.to].filter(Boolean), ...transaction });
  return createdTrigger(balanceTrigger, 'transactions/{transactionId}', await ref.get());
};

describe('balance trigger', () => {
  beforeEach(() => writePlayers('player', 'admin'));

  it('should add a deposit to the balance', async () => {
    await createTransaction({ from: null, to: players.player.uid, amount: 100 });
    expect((await readPlayer(players.player.uid)).balance).toBe(300);
  });

  it('should subtract a withdraw from the balance', async () => {
    await createTransaction({ from: players.player.uid, to: null, amount: 100 });
    expect((await readPlayer(players.player.uid)).balance).toBe(100);
  });

  it('should move a transfer between the balances', async () => {
    await createTransaction({ from: players.player.uid, to: players.admin.uid, amount: 100 });
    expect((await readPlayer(players.player.uid)).balance).toBe(100);
    expect((await readPlayer(players.admin.uid)).balance).toBe(200);
  });
});
