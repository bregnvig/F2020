import { log } from 'firebase-functions/logger';
import { config } from 'firebase-functions/v1';
import { getMessaging } from 'firebase-admin/messaging';

export const sendNotification = (tokens: string[], title: string, body: string, data?: { [key: string]: string; }): Promise<any> => {
  if (config().test) {
    log('Send message/notification in test environment', title, body);
    return Promise.resolve('Send message/notification in test environment');
  }
  return getMessaging().sendEachForMulticast({
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
  }).then((response) => {
    // Response is a message ID string.
    log('Successfully sent message:', response);
  }).catch((error) => {
    log('Error sending message:', error);
  });
};
