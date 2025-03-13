import { getMessaging } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions';

export const sendNotification = (tokens: string[], title: string, body: string, badge = 'https://f1.bregnvig.dk/assets/messaging/badge.v2.png', data?: {
  [key: string]: string;
}): Promise<any> => {
  try {
    return getMessaging().sendEachForMulticast({
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
    }).then(response => {
      // Response is a message ID string.
      logger.info(`Successfully sent notification. Success: ${response.successCount}, Failure: ${response.failureCount}`);
    });
  } catch (error) {
    logger.error('Error sending message:', error);
  }
};
