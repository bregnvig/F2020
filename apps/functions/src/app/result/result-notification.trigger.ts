import { Bid, ISeason, WBC, WBCResult } from '@f2020/data';
import { log } from 'firebase-functions/logger';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { collectionPaths, openai, sendMail, sendNotification } from '../../lib';
import { getFirestore } from 'firebase-admin/firestore';

const wbcPointsToPosition = {
  25: 'første',
  18: 'anden',
  15: 'tredje',
};

const wbcPointsToDescription = {
  25: (bids: Bid[]) => `${bids[0].player.displayName} fik ${bids[0].points} point, mens ${bids[1].player.displayName} kom på anden pladsen med ${bids[1].points} point`,
  18: (bids: Bid[]) => {
    const thirdPlace = bids[2] ? `, mens tredje pladsen gik til ${bids[2].player.displayName} som fik ${bids[2].points} point` : '';
    return `
      ${bids[1].player.displayName} kom på anden pladsen med ${bids[1].points} point.
      Første pladsen gik til ${bids[0].player.displayName} med ${bids[0].points} point
      ${thirdPlace}
    `;
  },
  15: (bids: Bid[]) => `${bids[2].player.displayName} kom på tredje pladsen med ${bids[2].points} point. Første pladsen gik til ${bids[0].player.displayName} med ${bids[0].points} point, mens anden pladsen gik til ${bids[1].player.displayName} som fik ${bids[1].points} point`,
};

const userChat = (name: string, raceName: string, wbcPoints: number, bids: Bid[]) => `
  Skriv besked til ${name} der kom på ${wbcPointsToPosition[wbcPoints]} pladsen løbet i ${raceName}. ${wbcPointsToDescription[wbcPoints](bids)}
`;

const aiGeneratedMailMessage = async (playerName: string, raceName: string, wbcPoints: number, bids: Bid[]): Promise<{ subject: string, body: string }> => {

  const response = await openai().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Du laver morsomme e-mail der beskriver deltagerens første, anden eller tredje plads i et F1 væddemål',
      },
      {
        role: 'user',
        content: userChat(playerName, raceName, wbcPoints, bids),
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'congratulation_schema',
        schema: {
          type: 'object',
          properties: {
            subject: {
              description: 'Emne til en email',
              type: 'string',
            },
            body: {
              description: 'Beskeden som en HTML mail body. Skal afsluttes med newline og så Wrouum, F1emming',
              type: 'string',
            },
          },
          additionalProperties: false,
        },
      },
    },
  });
  return JSON.parse(response.choices[0].message.content);
};

const aiGeneratedNotificationMessage = async (playerName: string, raceName: string, index: number): Promise<{ title: string, body: string }> => {

  const response = await openai().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Du laver morsomme en morsom smart phone notifikations title og body der beskriver deltagerens første anden eller tredje plads i et F1 væddemål. Du bliver oplyst følgende information navn på deltager, navn på løb, plcering. Notifikationen skal være på dansk',
      },
      {
        role: 'user',
        content: `${playerName}, ${raceName}, ${index + 1}`,
      },
    ],
    response_format: {
      // See /docs/guides/structured-outputs
      type: 'json_schema',
      json_schema: {
        name: 'congratulation_schema',
        schema: {
          type: 'object',
          properties: {
            subject: {
              title: 'Titlen på notifikationen',
              type: 'string',
            },
            body: {
              description: 'Notifikations beskeden',
              type: 'string',
            },
          },
          additionalProperties: false,
        },
      },
    },
  });
  return JSON.parse(response.choices[0].message.content);
};

const mailBody = (playerName: string, wbcPoints: number, raceName: string) => {

  return `<h3>Hej ${playerName}</h3>
     <div> 
      <p> ${raceName} er nu afgjort - du har fået ${wbcPoints} WBC points</p>
     </div>     
                  
     Wroouumm,<br/>
     F1emming`;
};

const notificationBody = (raceName: string, wbcPoints: number) => `${raceName} er nu afgjort - du har fået ${wbcPoints} WBC points`;

export const resultNotificationTrigger = onDocumentUpdated('seasons/{seasonId}', async event => {

  const before: WBC = event.data.before.data()?.wbc || [];
  const season = event.data.after.data() as ISeason;
  const after: WBC = season?.wbc;
  if ((after?.results?.length && (before.results?.length ?? 0) < (after.results?.length ?? 0))) {
    const result: WBCResult = after.results.find(r => !before.results?.some(({ round }) => round === r.round));
    const db = getFirestore();
    const raceResults = await db.collection(collectionPaths.bids(season.id, result.round)).where('submitted', '==', true).get()
      .then(snapshot => snapshot.docs)
      .then(snapshots => snapshots.map(s => s.data() as Bid))
      .then(raceResults => raceResults.sort((a, b) => b.points - a.points));
    log('Race', result.raceName, 'Is now completed - lets send notifications');
    return Promise.all(result.players.map(async (element, index) => {
      const sendWBCResult = async (place: string, badge?: string) => {
        const mail = index > 2
          ? {
            subject: place,
            body: mailBody(element.player.displayName, element.points, result.raceName),
          }
          : await aiGeneratedMailMessage(element.player.displayName, result.raceName, element.points, raceResults);
        const notification = index > 2
          ? {
            title: place,
            body: notificationBody(result.raceName, element.points),
          }
          : await aiGeneratedNotificationMessage(element.player.displayName, result.raceName, index);
        await sendMail(element.player.email, mail.subject, mail.body).then((msg) => {
          log(`Mail result :(${msg})`);
        });
        if (element.player.tokens?.length) {
          await sendNotification(element.player.tokens, notification.title, notification.body, badge).then(msg => {
            log(`Notification result :(${msg})`);
          });
        }
      };
      if ([25, 18, 15].includes(element.points)) {
        await sendWBCResult('ai generated', 'https://f1.bregnvig.dk/assets/messaging/trophy.png');
      } else if ([12, 10, 8, 6, 4, 2, 1].includes(element.points)) {
        await sendWBCResult('😒 Selvom du ikke kom i top tre - så fik du da points :-)');
      } else {
        await sendWBCResult('🫣 Æv du fik ingen points  :-(');
      }
    }));
  }
  return Promise.resolve();
});
