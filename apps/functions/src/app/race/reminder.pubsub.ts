import { IRace, Player } from '@f2020/data';
import { log } from 'firebase-functions/logger';
import { region } from 'firebase-functions/v1';
import { DateTime } from 'luxon';
import { getCurrentRace, playerWithoutBid, sendMail } from '../../lib';
import { sendNotification } from './../../lib';

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
export const mailReminderCrontab = region('europe-west1').pubsub.schedule('11 9 * * *')
  .timeZone('Europe/Copenhagen')
  .onRun(async () => getCurrentRace('open')
    .then(async race => {
      if (timespan(3, race!.close) || timespan(1, race!.close)) {
        const players = await playerWithoutBid();
        const closeDay = dayNames.get(race!.close.setLocale('da').toFormat('E'))!;
        const closeTime = race!.close.setLocale('da').setZone('Europe/Copenhagen').toFormat('T');
        return Promise.all(players.map(player => {
          log(`Should mail to ${player.displayName}`);
          const results = [
            sendMail(player.email, `Tid til at spille på det ${race!.name} `, mailBody(player, race!, closeDay, closeTime)).then((msg) => {
              log(`sendMail result :(${msg})`);
            }),
          ];
          if (player.tokens && player.tokens.length) {
            log(`Should send message to ${player.displayName}`);
            results.push(sendNotification(player.tokens, `Husk at spille`, notificationMessage(race!, closeDay, closeTime)));
          }
          return Promise.all(results);
        }));
      }
      return Promise.resolve(true);
    })
    .catch(() => {
      log('No open race');
      return Promise.resolve(true);
    }),
  );
