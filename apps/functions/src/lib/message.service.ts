import { getMessaging } from 'firebase-admin/messaging';
import { log } from 'firebase-functions/logger';

export const sendNotification = async (tokens: string[], title: string, body: string, badge = 'https://f2020.bregnvig.dk/assets/messaging/badge.v2.png', data?: { [key: string]: string; }): Promise<any> => {
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
          icon: 'https://f2020.bregnvig.dk/assets/icons/icon-192x192.png',
        },
      },
    });
    // Response is a message ID string.
    log(`Successfully sent notification. Success: ${response.successCount}, Failure: ${response.failureCount}`);
  } catch (error) {
    log('Error sending message:', error);
  }
};
