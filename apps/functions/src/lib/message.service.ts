import { log } from 'firebase-functions/logger';
import { getMessaging } from 'firebase-admin/messaging';

export const sendNotification = async (tokens: string[], title: string, body: string, data?: { [key: string]: string; }): Promise<any> => {
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
          badge: 'https://f2020.bregnvig.dk/assets/messaging/badge.v2.png',
          icon: 'https://f2020.bregnvig.dk/assets/icons/icon-192x192.png',
        },
      },
    });
    // Response is a message ID string.
    log('Successfully sent message:', response);
  } catch (error) {
    log('Error sending message:', error);
  }
};
