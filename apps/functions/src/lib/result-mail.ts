import { Bid, Player } from '@f2020/data';
import { warn } from 'firebase-functions/logger';
import { openai, OpenAIModel } from './openai.service';

export interface Roast {
  best: string;
  worst: string;
}

export const escapeHtml = (text: string = '') => text.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

/**
 * One roast of the best and the worst players, shared by every mail. The mail is sent without it when OpenAI fails
 * @param situation What the result is, e.g. "mellemresultatet efter kvalifikationen i Singapore"
 * @param results The bids sorted by points, best first
 * @param describe Describes a group of players with the same points to OpenAI
 */
export const aiGeneratedRoast = async (situation: string, results: Partial<Bid>[], describe: (bids: Partial<Bid>[]) => string): Promise<Roast | undefined> => {
  const best = results.filter(r => r.points === results[0]?.points);
  const worst = results.filter(r => r.points === results.at(-1)?.points);
  if (best.length === results.length) {
    return undefined;
  }
  try {
    const response = await openai().chat.completions.create({
      model: OpenAIModel,
      messages: [
        {
          role: 'system',
          content: `Du er kommentator i et F1 væddemål mellem venner, og skriver om ${situation}.
            Brug tør, sarkastisk dansk humor. Vær drillende og gerne lidt fræk og uforskammet, som når gode venner sviner hinanden til,
            men hold det til deres evner som F1-tippere. Ingen bandeord. Skriv på dansk, to til fire sætninger til hver.
            Er der flere med samme point, så nævn dem alle.`,
        },
        {
          role: 'user',
          content: `Bedst:\n${describe(best)}\n\nDårligst:\n${describe(worst)}`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'result_roast',
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
    warn('Could not generate the roast of', situation, error);
    return undefined;
  }
};

const avatar = (player?: Partial<Player>) => player?.photoURL
  ? `<img src="${escapeHtml(player.photoURL)}" width="32" height="32" alt="" style="border-radius:50%;display:block">`
  : `<div style="width:32px;height:32px;border-radius:50%;background:#e91e63;color:#fff;text-align:center;line-height:32px;font-weight:bold">${escapeHtml(player?.displayName?.charAt(0))}</div>`;

/**
 * The players with their pictures and points. Players with the same points share the position, and the player reading it is highlighted
 * @param extra An extra column, e.g. the WBC points
 */
export const standingsTable = (player: Player, results: Partial<Bid>[], extra?: (bid: Partial<Bid>) => string): string => {
  const rows = results.map((r, index) => {
    const isMe = r.player?.uid === player.uid;
    const position = results.findIndex(other => other.points === r.points) + 1;
    return `<tr style="${isMe ? 'background:#fce4ec;font-weight:bold' : ''}">
      <td style="padding:4px 8px;text-align:right">${index === 0 || results[index - 1].points !== r.points ? `${position}.` : ''}</td>
      <td style="padding:4px 8px">${avatar(r.player)}</td>
      <td style="padding:4px 8px">${escapeHtml(r.player?.displayName)}</td>
      <td style="padding:4px 8px;text-align:right">${r.points} point</td>
      ${extra ? `<td style="padding:4px 8px;text-align:right">${extra(r)}</td>` : ''}
    </tr>`;
  });
  return `<table style="border-collapse:collapse">${rows.join('')}</table>`;
};

const roastSection = (title: string, text: string) => `
  <p style="margin:16px 0 4px;font-weight:bold">${title}</p>
  <p style="margin:0">${escapeHtml(text)}</p>`;

export const roastSections = (roast: Roast | undefined, bestTitle: string, worstTitle: string): string =>
  roast ? roastSection(bestTitle, roast.best) + roastSection(worstTitle, roast.worst) : '';

export const resultMail = (player: Player, intro: string, content: string, link: string): string =>
  `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px">
     <h3>Hej ${escapeHtml(player.displayName)}</h3>
     <p>${intro}</p>
     ${content}
     <p style="margin-top:24px"><a href="${link}">Se løbet</a></p>
     <p>Wroouumm,<br/>F1emming</p>
   </div>`;
