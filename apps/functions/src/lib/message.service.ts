import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions';
import { collectionPaths } from './paths';

const staleTokenErrors = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

const removeStaleTokens = async (staleTokens: string[]): Promise<void> => {
  const db = getFirestore();
  await Promise.all(staleTokens.map(async token => {
    const players = await db.collection(collectionPaths.players()).where('tokens', 'array-contains', token).get();
    await Promise.all(players.docs.map(doc => doc.ref.update({ tokens: FieldValue.arrayRemove(token) })));
    logger.info(`Removed stale token from ${players.size} player(s)`);
  }));
};

export const sendNotification = async (tokens: string[], title: string, body: string, badge = 'https://f1.bregnvig.dk/assets/messaging/badge.v2.png', data?: {
  [key: string]: string;
}): Promise<void> => {
  try {
    const response = await getMessaging().sendEachForMulticast({
      data,
      tokens,
      notification: {
        title,
        body,
      },
      webpush: {
        notification: {
          badge,
          icon: 'https://f1.bregnvig.dk/assets/icons/icon-192x192.png',
        },
      },
    });
    logger.info(`Successfully sent notification. Success: ${response.successCount}, Failure: ${response.failureCount}`);
    const staleTokens = response.responses
      .map((r, index) => ({ error: r.error, token: tokens[index] }))
      .filter(({ error }) => error)
      .map(({ error, token }) => {
        logger.warn(`Unable to send notification: ${error.code} - ${error.message}`);
        return staleTokenErrors.has(error.code) ? token : undefined;
      })
      .filter(Boolean);
    if (staleTokens.length) {
      await removeStaleTokens(staleTokens);
    }
  } catch (error) {
    logger.error('Error sending message:', error);
  }
};
