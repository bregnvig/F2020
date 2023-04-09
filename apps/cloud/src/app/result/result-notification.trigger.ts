import { WBC, WBCResult } from '@f2020/data';
import { log } from 'firebase-functions/logger';
import { Change, EventContext, region } from 'firebase-functions/v1';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { sendMail, sendMessage } from '../../lib';
;

const mailbody = (playerName: any, wbcPoints: number, raceName: any) =>
  `<h3>Hej ${playerName}</h3>
     <div> 
      <p> ${raceName} er nu afgjort - du har fået ${wbcPoints} WBC points</p>
     </div>     
                  
     Wroouumm,<br/>
     F1emming`;

const messageBody = (raceName: string, wbcPoints: number) => `${raceName} er nu afgjort - du har fået ${wbcPoints} WBC points`;

export const resultNotificationTrigger = region('europe-west1').firestore.document('seasons/{seasonId}')
  .onUpdate(async (change: Change<DocumentSnapshot>, context: EventContext) => {
    const before: WBC = change.before.data()?.wbc || [];
    const after: WBC = change.after.data()?.wbc || [];
    if ((after.results?.length && (before.results?.length ?? 0) < (after.results?.length ?? 0))) {
      const result: WBCResult = after.results.find(r => !before.results.some(({ round }) => round === r.round));
      log('Race', result.raceName, 'Is now completed - lets send notifications');
      return Promise.all(result.players.map(element => {
        const sendWBCResult = (place: string) => {
          const notifications = [
            sendMail(element.player.email, place, mailbody(element.player.displayName, element.points, result.raceName)).then((msg) => {
              log(`Mail result :(${msg})`);
            })
          ];
          if (element.player.tokens?.length) {
            notifications.push(sendMessage(element.player.tokens, place, messageBody(result.raceName, element.points)).then((msg) => {
              log(`Message result :(${msg})`);
            }));
          }
          return Promise.all(notifications);
        };
        if ([12, 10, 8, 6, 4, 2, 1].indexOf(element.points) > -1) {
          return sendWBCResult('😒 Selvom du ikke kom i top tre - så fik du da points :-)');
        }
        if (element.points === 25) {
          return sendWBCResult('🥇 Tillykke med din første plads :-)');
        }
        if (element.points === 18) {
          return sendWBCResult('🥈 Tillykke med din anden plads :-)');
        }
        if (element.points === 15) {
          return sendWBCResult('🥉 Tillykke med din tredje plads :-)');
        }
        return sendWBCResult('🫣 Æv du fik ingen points  :-(');
      }));
    }
    return Promise.resolve();
  });