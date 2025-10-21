import { onSchedule } from 'firebase-functions/v2/scheduler';
import { DateTime } from 'luxon';
import { finalNotificationMessage, getCurrentRace, mailBody, notificationMessage, playerWithoutBid, sendMail } from '../../lib';
import { sendNotification } from './../../lib';
import { logger } from 'firebase-functions';

// This will be run every day every hours at 11 minutes past the hour Europe/Copenhagen!
export const mailReminderCrontab = onSchedule({
    timeZone: 'Europe/Copenhagen',
    schedule: '11 * * * *',
  }, async () => {
    const race = await getCurrentRace('open');
    if (race) {
      const diff = race.close.diffNow(['days', 'hours', 'minutes']);
      if (diff.days === 1 && DateTime.local().hour === 11) {
        const players = await playerWithoutBid();
        const { subject: notificationSubject, body: notificationBody } = await notificationMessage(race);
        logger.info(`Generated OpenAI notification. Subject: ${notificationSubject}. Body: ${notificationBody}`);
        await Promise.all(players.map(async player => {
          const result: Promise<void>[] = [];
          logger.info(`Should mail to ${player.displayName}`);
          result.push(sendMail(player.email, `Tid til at spille på det ${race.name} `, mailBody(player, race)).then((msg) => {
            logger.info(`sendMail result :(${msg})`);
          }));
          if (player.tokens && player.tokens.length) {
            logger.info(`Should send notification to ${player.displayName}`);
            result.push(
              sendNotification(player.tokens, notificationSubject, notificationBody),
            );
          }
          return Promise.all(result);
        }));
      } else if (diff.days === 0 && diff.hours === 0) {
        const players = await playerWithoutBid();
        await Promise.all(players.map(player => {
          if (player.tokens && player.tokens.length) {
            logger.info(`Should send final reminder notification to ${player.displayName}`);
            return sendNotification(player.tokens, `Tik tok tiden går`, finalNotificationMessage(race));
          }
        }));
      } else {
        logger.info(`No reminder needs to sent at this time`);
      }
    } else if (!race) {
      logger.info('No open race');
    }

  },
);
