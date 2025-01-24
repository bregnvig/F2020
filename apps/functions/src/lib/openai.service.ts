import { requiredValue } from '@f2020/tools';
import OpenAI from 'openai';

export const openai = () => {

  const apiKey = requiredValue(process.env.OPEN_AI_API_KEY, 'API key for OpenAI is missing');
  const project = requiredValue(process.env.OPEN_AI_PROJECT, 'Project for OpenAI is missing');
  const organization = requiredValue(process.env.OPEN_AI_ORGANIZATION, 'Organization for OpenAI is missing');

  return new OpenAI({
    apiKey,
    organization,
    project,
  });
};
