import { messaging } from "firebase-admin";
import { log } from "firebase-functions/logger";
import { config } from "firebase-functions/v1";

export const sendMessage = (tokens: string[], title: string, body: string, data?: { [key: string]: string; }): Promise<any> => {
  if (config().test) {
    return Promise.resolve('Send message/notification in test environment');
  }
  return messaging().sendMulticast({
    data,
    tokens,
    notification: {
      title,
      body,
    },
    webpush: {
      notification: {
        badge: 'https://f2020.bregnvig.dk/assets/messaging/badge.v2.png',
        icon: 'https://f2020.bregnvig.dk/assets/icons/icon-192x192.png'
      }
    }
  }).then((response) => {
    // Response is a message ID string.
    log('Successfully sent message:', response);
  }).catch((error) => {
    log('Error sending message:', error);
  });
};
