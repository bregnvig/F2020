import { IRace, Player } from '@f2020/data';
import { log } from 'firebase-functions/logger';
import { DateTime } from 'luxon';
import { getCurrentRace, playerWithoutBid, sendMail } from '../../lib';
import { sendNotification } from './../../lib';
import { onSchedule } from 'firebase-functions/v2/scheduler';

const timespan = (days: number, date: DateTime): boolean => {
  const reminderDate = date.minus({ days });
  return Math.floor(reminderDate.diff(DateTime.local(), 'day').days) === 0;
};

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
     <p> Du kan spille <a href="https://f2020.bregnvig.dk/">her</a>
     </div>     
                  
     Wroouumm,<br/>
     F1emming`;
const notificationMessage = (race: IRace, closeDay: string, closeTime: string): string =>
  `${race.name} lukker ${closeDay} kl.${closeTime}, og du har endnu ikke spillet!`;

// This will be run every day at 9:11 Europe/Copenhagen!
export const mailReminderCrontab = onSchedule({
    timeZone: 'Europe/Copenhagen',
    schedule: '11 6 * * *',
  }, async () => getCurrentRace('open')
    .then(async race => {
      if (race && timespan(3, race.close) || timespan(1, race.close)) {
        const players = await playerWithoutBid();
        const closeDay = dayNames.get(race.close.setLocale('da').toFormat('E'))!;
        const closeTime = race.close.setLocale('da').setZone('Europe/Copenhagen').toFormat('T');
        await Promise.all(players.map(player => {
          log(`Should mail to ${player.displayName}`);
          sendMail(player.email, `Tid til at spille på det ${race.name} `, mailBody(player, race, closeDay, closeTime)).then((msg) => {
            log(`sendMail result :(${msg})`);
          });
          if (player.tokens && player.tokens.length) {
            log(`Should send message to ${player.displayName}`);
            sendNotification(player.tokens, `Husk at spille`, notificationMessage(race, closeDay, closeTime));
          }
        }));
      } else if (!race) {
        log('No open race');
      }
    }),
);

