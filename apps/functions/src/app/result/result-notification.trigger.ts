import { WBC, WBCResult } from '@f2020/data';
import { log } from 'firebase-functions/logger';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { sendMail, sendNotification } from '../../lib';

const mailBody = (playerName: string, wbcPoints: number, raceName: string) =>
  `<h3>Hej ${playerName}</h3>
     <div> 
      <p> ${raceName} er nu afgjort - du har fået ${wbcPoints} WBC points</p>
     </div>     
                  
     Wroouumm,<br/>
     F1emming`;

const messageBody = (raceName: string, wbcPoints: number) => `${raceName} er nu afgjort - du har fået ${wbcPoints} WBC points`;

export const resultNotificationTrigger = onDocumentUpdated('seasons/{seasonId}', async event => {
  const before: WBC = event.data.before.data()?.wbc || [];
  const after: WBC = event.data.after.data()?.wbc || [];
  if ((after.results?.length && (before.results?.length ?? 0) < (after.results?.length ?? 0))) {
    const result: WBCResult = after.results.find(r => !before.results.some(({ round }) => round === r.round));
    log('Race', result.raceName, 'Is now completed - lets send notifications');
    return Promise.all(result.players.map(async element => {
      const sendWBCResult = async (place: string, badge?: string) => {
        await sendMail(element.player.email, place, mailBody(element.player.displayName, element.points, result.raceName)).then((msg) => {
          log(`Mail result :(${msg})`);
        });
        if (element.player.tokens?.length) {
          await sendNotification(element.player.tokens, place, messageBody(result.raceName, element.points), badge);
        }
      };
      if ([12, 10, 8, 6, 4, 2, 1].indexOf(element.points) > -1) {
        await sendWBCResult('😒 Selvom du ikke kom i top tre - så fik du da points :-)');
      }
      if (element.points === 25) {
        await sendWBCResult('🥇 Tillykke med din første plads :-)', 'https://f2020.bregnvig.dk/assets/messaging/trophy.png');
      }
      if (element.points === 18) {
        await sendWBCResult('🥈 Tillykke med din anden plads :-)', 'https://f2020.bregnvig.dk/assets/messaging/trophy.png');
      }
      if (element.points === 15) {
        await sendWBCResult('🥉 Tillykke med din tredje plads :-)', 'https://f2020.bregnvig.dk/assets/messaging/trophy.png');
      }
      await sendWBCResult('🫣 Æv du fik ingen points  :-(');
    }));
  }
  return Promise.resolve();
});
