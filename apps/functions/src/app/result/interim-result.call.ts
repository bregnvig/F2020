import { Bid, calculateInterimResult, IRace, Player, validateInterimResult } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { log, warn } from 'firebase-functions/logger';
import { CallableRequest, onCall } from 'firebase-functions/v2/https';
import { collectionPaths, currentSeason, documentPaths, getCurrentRace, internalError, logAndCreateError, openai, OpenAIModel, raceLink, sendMail, sendNotification, validateAccess } from '../../lib';

interface Roast {
  best: string;
  worst: string;
}

const escapeHtml = (text: string = '') => text.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

/** Driver ids are e.g. max_verstappen */
const driverName = (driverId?: string) => driverId?.replace(/_/g, ' ') ?? 'ingen';

const describe = (bids: Partial<Bid>[], result: Partial<Bid>) => bids
  .map(bid => `${bid.player?.displayName} med ${bid.points} point. Gættede kvalifikationen ${bid.qualify?.slice(0, 6).map(driverName).join(', ')}`
    + ` og ramte ${bid.qualifyPoints?.filter(p => p > 0).length ?? 0} af dem`)
  .join('\n') + `\nDen rigtige kvalifikation blev ${result.qualify?.slice(0, 6).map(driverName).join(', ')}`;

/** One roast of the best and the worst players, shared by every mail. The mail is sent without it when OpenAI fails */
const aiGeneratedRoast = async (race: IRace, results: Partial<Bid>[], result: Partial<Bid>): Promise<Roast | undefined> => {
  const best = results.filter(r => r.points === results[0].points);
  const worst = results.filter(r => r.points === results.at(-1)!.points);
  if (best.length === results.length) {
    return undefined;
  }
  try {
    const response = await openai().chat.completions.create({
      model: OpenAIModel,
      messages: [
        {
          role: 'system',
          content: `Du er kommentator i et F1 væddemål mellem venner, og skriver om mellemresultatet efter kvalifikationen.
            Brug tør, sarkastisk dansk humor. Vær drillende og gerne lidt fræk og uforskammet, som når gode venner sviner hinanden til,
            men hold det til deres evner som F1-tippere. Ingen bandeord. Skriv på dansk, to til fire sætninger til hver.
            Er der flere med samme point, så nævn dem alle.`,
        },
        {
          role: 'user',
          content: `Løbet er ${race.name}.\nBedst indtil videre:\n${describe(best, result)}\n\nDårligst indtil videre:\n${describe(worst, result)}`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'interim_roast',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              best: {
                description: 'Ros, med et stik, til dem der fører. Ren tekst uden HTML',
                type: 'string',
              },
              worst: {
                description: 'Et kærligt spark til dem der ligger sidst. Ren tekst uden HTML',
                type: 'string',
              },
            },
            required: ['best', 'worst'],
            additionalProperties: false,
          },
        },
      },
    });
    return JSON.parse(response.choices[0].message.content!) as Roast;
  } catch (error) {
    warn('Could not generate the interim roast', error);
    return undefined;
  }
};

const avatar = (player?: Partial<Player>) => player?.photoURL
  ? `<img src="${escapeHtml(player.photoURL)}" width="32" height="32" alt="" style="border-radius:50%;display:block">`
  : `<div style="width:32px;height:32px;border-radius:50%;background:#e91e63;color:#fff;text-align:center;line-height:32px;font-weight:bold">${escapeHtml(player?.displayName?.charAt(0))}</div>`;

const roastSection = (title: string, text: string) => `
  <p style="margin:16px 0 4px;font-weight:bold">${title}</p>
  <p style="margin:0">${escapeHtml(text)}</p>`;

const mailBody = (player: Player, race: IRace, results: Partial<Bid>[], roast?: Roast): string => {
  const rows = results.map((r, index) => {
    const isMe = r.player?.uid === player.uid;
    const position = results.findIndex(other => other.points === r.points) + 1;
    return `<tr style="${isMe ? 'background:#fce4ec;font-weight:bold' : ''}">
      <td style="padding:4px 8px;text-align:right">${index === 0 || results[index - 1].points !== r.points ? `${position}.` : ''}</td>
      <td style="padding:4px 8px">${avatar(r.player)}</td>
      <td style="padding:4px 8px">${escapeHtml(r.player?.displayName)}</td>
      <td style="padding:4px 8px;text-align:right">${r.points} point</td>
    </tr>`;
  });
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px">
     <h3>Hej ${escapeHtml(player.displayName)}</h3>
     <p>Mellemresultatet for ${escapeHtml(race.name)} er klart. Indtil videre ser det ca. sådan her ud</p>
     <table style="border-collapse:collapse">${rows.join('')}</table>
     ${roast ? roastSection('🏆 I front', roast.best) + roastSection('🐌 Bagerst', roast.worst) : ''}
     <p style="margin-top:24px"><a href="${raceLink(race.season, race.round)}">Se løbet</a></p>
     <p>Wroouumm,<br/>F1emming</p>
   </div>`;
};

const messageBody = (player: Player, results: Partial<Bid>[]): string => {
  const index = results.findIndex(r => r.player?.uid === player.uid);
  return `Og du ligger på en foreløbig ${index + 1}. plads!`;
};

export const submitInterimResult = onCall(async (request: CallableRequest<Bid>) => {
  return validateAccess(request.auth?.uid, 'admin')
    .then(() => buildResult(request.data))
    .then(() => true)
    .catch(internalError);
});

const buildResult = async (result: Partial<Bid>) => {
  const season = await currentSeason();
  const race = await getCurrentRace('closed');

  if (!season || !race) {
    throw logAndCreateError('not-found', 'Season or race', season?.name, race?.name);
  }

  try {
    validateInterimResult(result, race);
  } catch (error) {
    throw logAndCreateError('failed-precondition', error.message);
  }

  const db = getFirestore();
  const calculatedResults: Partial<Bid>[] = await db.collection(collectionPaths.bids(race.season, race.round)).where('submitted', '==', true).get()
    .then(snapshot => snapshot.docs)
    .then(snapshots => snapshots.map(s => s.data()))
    .then(bids => bids.map(bid => calculateInterimResult(bid as Bid, result)))
    .then(bids => bids.sort((a, b) => b.points! - a.points!));

  await db.runTransaction(transaction => {
    calculatedResults.forEach(cr => {
      transaction.set(db.doc(documentPaths.bid(race.season, race.round, cr.player.uid)), cr);
    });
    transaction.update(db.doc(documentPaths.race(race.season, race.round)), { result });
    return Promise.resolve(`Interim result submitted`);
  }).then(async () => {
    const players = calculatedResults.map(cr => cr.player!);
    const roast = await aiGeneratedRoast(race, calculatedResults, result);
    return Promise.all(players.map(async player => {
      log(`Should mail to ${player.displayName}`);
      await sendMail(player.email, `Så er der mellemresultat for ${race.name}`, mailBody(player, race, calculatedResults, roast));
      if (player.tokens && player.tokens.length) {
        log(`Should send notification to ${player.displayName}`);
        await sendNotification(player.tokens, `Mellemresultat for ${race.name}`, messageBody(player, calculatedResults), { link: raceLink(race.season, race.round) });
      } else {
        log('No tokens to send notifications to');
      }
    }));
  });
};
