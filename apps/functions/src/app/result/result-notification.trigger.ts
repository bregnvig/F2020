import { Bid, ISeason, Player, WBC, WBCResult } from '@f2020/data';
import { log, warn } from 'firebase-functions/logger';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { aiGeneratedRoast, appLink, collectionPaths, escapeHtml, openai, OpenAIModel, raceLink, resultMail, Roast, roastSections, sendMail, sendNotification, standingsTable } from '../../lib';
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
    model: OpenAIModel,
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
    model: OpenAIModel,
    messages: [
      {
        role: 'system',
        content: 'Du laver morsomme en morsom smart phone notifikations title og body der beskriver deltagerens første anden eller tredje plads i et F1 væddemål. Du bliver oplyst følgende information navn på deltager, navn på løb, placering. Notifikationen skal være på dansk',
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
            title: {
              description: 'Titlen på notifikationen',
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

const mailBody = (player: Player, wbcPoints: number, result: WBCResult, seasonId: string, bids: Bid[], roast?: Roast) => {
  const wbcPointsOf = (bid: Partial<Bid>) => result.players.find(p => p.player.uid === bid.player?.uid)?.points ?? 0;
  return resultMail(
    player,
    `${escapeHtml(result.raceName)} er nu afgjort - du har fået ${wbcPoints} WBC point`,
    standingsTable(player, bids, bid => `${wbcPointsOf(bid)} WBC`) + roastSections(roast, '🏆 Vinderen', '🐌 Bundproppen'),
    raceLink(seasonId, result.round),
  );
};

const describe = (result: WBCResult) => (bids: Partial<Bid>[]) => bids
  .map(bid => `${bid.player?.displayName} med ${bid.points} point og ${result.players.find(p => p.player.uid === bid.player?.uid)?.points ?? 0} WBC point`)
  .join('\n');

const notificationBody = (raceName: string, wbcPoints: number) => `${raceName} er nu afgjort - du har fået ${wbcPoints} WBC points`;

type Notification = { title: string, body: string };

/** One call for the notifications of every player outside the top three. A player missing in the answer gets the plain notification */
const aiGeneratedNotifications = async (raceName: string, players: { player: Player, points: number, position: number }[]): Promise<Map<string, Notification>> => {
  if (!players.length) {
    return new Map();
  }
  try {
    const response = await openai().chat.completions.create({
      model: OpenAIModel,
      messages: [
        {
          role: 'system',
          content: `Du laver korte smart phone notifikationer til deltagerne i et F1 væddemål mellem venner, om deres placering i løbet i ${raceName}.
            De kom ikke i top tre. Brug tør, sarkastisk dansk humor. Vær drillende og gerne lidt fræk og uforskammet, som når gode venner sviner
            hinanden til, men hold det til deres evner som F1-tippere. Ingen bandeord. Nævn hvor mange WBC point de fik.
            Dem der fik 0 WBC point skal have ekstra hårdt, de var ikke engang gode nok til at få et eneste point.
            Lav en notifikation til hver deltager, og giv hver deltager sin egen. Svar med deltagerens id`,
        },
        {
          role: 'user',
          content: players.map(({ player, points, position }) => `id ${player.uid}: ${player.displayName}, ${position}. plads, ${points} WBC point`).join('\n'),
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'result_notifications',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              notifications: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { description: 'Deltagerens id', type: 'string' },
                    title: { description: 'Titlen på notifikationen, højst 50 tegn', type: 'string' },
                    body: { description: 'Notifikations beskeden, højst 150 tegn', type: 'string' },
                  },
                  required: ['id', 'title', 'body'],
                  additionalProperties: false,
                },
              },
            },
            required: ['notifications'],
            additionalProperties: false,
          },
        },
      },
    });
    const { notifications } = JSON.parse(response.choices[0].message.content!) as { notifications: (Notification & { id: string })[] };
    return new Map(notifications.map(({ id, title, body }) => [id, { title, body }]));
  } catch (error) {
    warn('Could not generate the result notifications', error);
    return new Map();
  }
};

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
    // The players outside the top three share one roast
    const roast = result.players.length > 3 ? await aiGeneratedRoast(`det endelige resultat af løbet i ${result.raceName}`, raceResults, describe(result)) : undefined;
    const notifications = await aiGeneratedNotifications(result.raceName, result.players
      .map((element, index) => ({ ...element, position: index + 1 }))
      .filter(({ player }, index) => index > 2 && player.tokens?.length));
    return Promise.all(result.players.map(async (element, index) => {
      const sendWBCResult = async (place: string, badge?: string) => {
        const mail = index > 2
          ? {
            subject: place,
            body: mailBody(element.player, element.points, result, season.id, raceResults, roast),
          }
          : await aiGeneratedMailMessage(element.player.displayName, result.raceName, element.points, raceResults);
        const notification = index > 2
          ? notifications.get(element.player.uid) ?? {
            title: place,
            body: notificationBody(result.raceName, element.points),
          }
          : await aiGeneratedNotificationMessage(element.player.displayName, result.raceName, index);
        await sendMail(element.player.email, mail.subject, mail.body).then((msg) => {
          log(`Mail result :(${msg})`);
        });
        if (element.player.tokens?.length) {
          await sendNotification(element.player.tokens, notification.title, notification.body, { badge, link: appLink(season.id, 'wbc', 'race', result.round) }).then(msg => {
            log(`Notification result :(${msg})`);
          });
        }
      };
      if ([25, 18, 15].includes(element.points)) {
        await sendWBCResult('ai generated', 'https://f1.bregnvig.dk/assets/messaging/trophy.png');
      } else if ([12, 10, 8, 6, 4, 2, 1].includes(element.points)) {
        await sendWBCResult('😒 Selvom du ikke kom i top tre - så fik du da points :-)');
      } else {
        await sendWBCResult('🫣 Æv du fik ingen points :-(');
      }
    }));
  }
  return Promise.resolve();
});
