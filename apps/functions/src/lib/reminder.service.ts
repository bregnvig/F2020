import { Bid, IRace, Player } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { getCurrentRace } from './race.service';
import { collectionPaths } from './paths';
import { DateTime } from 'luxon';
import { requiredValue } from '@f2020/tools';
import { openai, OpenAIModel } from './openai.service';


export const playerWithoutBid = async (): Promise<Player[]> => {


  const currentRace = await getCurrentRace('open');

  const db = getFirestore();
  const played: Set<string> = await db.collection(collectionPaths.bids(currentRace.season, currentRace.round))
    .where('submitted', '==', true)
    .get()
    .then(snapshot => snapshot.docs.map(d => d.data() as Bid))
    .then(bids => bids.map(b => b.player!.uid))
    .then((uids: string[]) => new Set<string>(uids));

  const players = await db.collection(collectionPaths.players())
    .where('roles', 'array-contains', 'player')
    .get()
    .then(snapshot => snapshot.docs.map(d => d.data() as Player));
  return players.filter(player => !played.has(player.uid) && player.receiveReminders !== false);
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

const closeText = (closes: DateTime) => {
  const closeDay = requiredValue(dayNames.get(closes.setLocale('da').toFormat('E')), 'Weekday');
  const closeTime = closes.setLocale('da').setZone('Europe/Copenhagen').toFormat('T');
  return { closeDay, closeTime };
};

export const mailBody = (player: Player, race: IRace) => {
  const { closeDay, closeTime } = closeText(race.close);
  return `<h3>Hej ${player.displayName}</h3>
     <div> 
     <p> ${race.name} - lukker snart og du har ikke spillet endnu! Du kan heldigvis stadig nå det, men skynd dig for
     spillet lukker på ${closeDay} klokken ${closeTime}</p>
     <p> Du kan spille <a href="https://f1.bregnvig.dk/">her</a>
     </div>     
                  
     Wroouumm,<br/>
     F1emming`;
};

// const notificationMessage = (race: IRace, closeDay: string, closeTime: string): string =>
//   `${race.name} lukker ${closeDay} kl.${closeTime}, og du har endnu ikke spillet!`;
export const finalNotificationMessage = (race: IRace): string =>
  `${race.name} lukker lige om lidt, og du har endnu ikke spillet😲`;


// Define a specific type for the expected JSON response
type NotificationResponse = {
  subject: string;
  body: string;
};

/**
 * Generates a notification message using a haiku poem from the OpenAI API.
 * @param race - The race object containing details like name and close time.
 * @returns A promise that resolves to an object with a subject and body.
 */
export const notificationMessage = async (race: IRace): Promise<NotificationResponse> => {
  const { closeDay, closeTime } = closeText(race.close);

  try {
    const response = await openai().chat.completions.create({
      // Consider using the standard model name 'gpt-4o' for long-term compatibility
      model: OpenAIModel,
      messages: [
        {
          role: 'system',
          content: `
            You need to create a haiku poem to remind a person to submit their bet for the F1 betting game.
            You can weave the race name or closing time into the poem, but it is by no means a requirement.
            You will be provided with the following information by the user: name of the race, closing time, and day.
            The poem must be in Danish.
          `,
        },
        {
          role: 'user',
          content: `${race.name}, ${closeTime}, ${closeDay}`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'reminder_schema',
          schema: {
            type: 'object',
            properties: {
              subject: {
                description: 'The title of the notification that fits the haiku poem',
                type: 'string',
              },
              body: {
                description: 'The notification\'s haiku poem',
                type: 'string',
              },
            },
            required: ['subject', 'body'], // Ensure both properties are always returned
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;

    // Ensure content is not null or empty before parsing
    if (!content) {
      throw new Error('OpenAI API returned empty content.');
    }

    // Parse the JSON string and assert its type for type safety
    return JSON.parse(content) as NotificationResponse;

  } catch (error) {
    // Log the error and return a default/fallback object or re-throw
    console.error('Failed to generate notification message:', error);
    throw new Error('Error communicating with OpenAI API.');
  }
};
