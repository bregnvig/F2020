import { IRace, Player } from '@f2020/data';
import { requiredValue } from '@f2020/tools';
import { log } from 'firebase-functions/logger';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { DateTime } from 'luxon';
import { getCurrentRace, playerWithoutBid, sendMail } from '../../lib';
import { sendNotification } from './../../lib';

const dayNames = new Map<string, string>([
  ['1', 'mandag'],
  ['2', 'tirsdag'],
  ['3', 'onsdag'],
  ['4', 'torsdag'],
  ['5', 'fredag'],
  ['6', 'lørdag'],
  ['7', 'søndag'],
]);

const mailBody = (player: Player, race: IRace, closeDay: string, closeTime: string) =>
  `<h3>Hej ${player.displayName}</h3>
     <div> 
     <p> ${race.name} - lukker snart og du har ikke spillet endnu! Du kan heldigvis stadig nå det, men skynd dig for
     spillet lukker på ${closeDay} klokken ${closeTime}</p>
     <p> Du kan spille <a href="https://f1.bregnvig.dk/">her</a>
     </div>     
                  
     Wroouumm,<br/>
     F1emming`;
const notificationMessage = (race: IRace, closeDay: string, closeTime: string): string =>
  `${race.name} lukker ${closeDay} kl.${closeTime}, og du har endnu ikke spillet!`;
const finalNotificationMessage = (race: IRace): string =>
  `${race.name} lukker lige om lidt, og du har endnu ikke spillet😲`;

// This will be run every day every hours at 11 minutes past the hour Europe/Copenhagen!
export const mailReminderCrontab = onSchedule({
    timeZone: 'Europe/Copenhagen',
    schedule: '11 * * * *',
  }, async () => getCurrentRace('open')
    .then(async race => {
      if (race) {
        const diff = race.close.diffNow(['days', 'hours', 'minutes']);
        if (diff.days === 1 && DateTime.local().hour === 11) {
          const players = await playerWithoutBid();
          const closeDay = requiredValue(dayNames.get(race.close.setLocale('da').toFormat('E')), 'Weekday');
          const closeTime = race.close.setLocale('da').setZone('Europe/Copenhagen').toFormat('T');
          await Promise.all(players.map(player => {
            log(`Should mail to ${player.displayName}`);
            sendMail(player.email, `Tid til at spille på det ${race.name} `, mailBody(player, race, closeDay, closeTime)).then((msg) => {
              log(`sendMail result :(${msg})`);
            });
            if (player.tokens && player.tokens.length) {
              log(`Should send notification to ${player.displayName}`);
              sendNotification(player.tokens, `Husk at spille`, notificationMessage(race, closeDay, closeTime));
            }
          }));
        } else if (diff.days === 0 && diff.hours === 0) {
          const players = await playerWithoutBid();
          await Promise.all(players.map(player => {
            if (player.tokens && player.tokens.length) {
              log(`Should send final reminder notification to ${player.displayName}`);
              sendNotification(player.tokens, `Tik tok tiden går`, finalNotificationMessage(race));
            }
          }));
        } else {
          log(`No reminder needs to sent at this time`);
        }
      } else if (!race) {
        log('No open race');
      }
    }),
);
