import OpenAI from 'openai';
import { environment } from '../environment/environment';
import { OpenAIModel } from '../../../functions/src/lib';

const openai = new OpenAI({
  apiKey: environment.openai.apiKey,
  organization: environment.openai.organization,
  project: environment.openai.project,
});

const adjectives = [
  'morsom',
  'kærlig',
  'formel',
  'uhøjtidelig',
  'seriøs',
  'venlig',
  'dramatisk',
  'poetisk',
  'sarkastisk',
  'varm',
  'livlig',
  'teknisk',
  'kritisk',
  'inspirerende',
  'underholdende',
  'informativ',
  'spændende',
  'humoristisk',
  'empatisk',
  'optimistisk',
];

const weather = async (data: Record<string, string | number>): Promise<string> => {

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];

  const response = await openai.chat.completions.create({
    model: OpenAIModel,
    messages: [
      {
        role: 'user',
        content: 'Med dette her data: ',
      },
      {
        role: 'user',
        content: JSON.stringify(data),
      },
      {
        role: 'user',
        content: `Hvordan ville du så beskrive vejret på en ${adjective} måde? 
          Og teksten skal ret kort. 
          Teksten må gerne lyde som om det har noget med F1 kvalificering at gøre. 
          Teksten skal være i datid. 
          Teksten skal altid starte med 'Vejret under kvalifikationen var' og så kommer dit
          `,
      },
    ],
  });
  return response.choices[0].message.content;
};

export const humanize = {
  weather,
};
