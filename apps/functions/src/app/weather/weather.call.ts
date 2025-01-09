import { CallableRequest, onCall } from 'firebase-functions/lib/v2/providers/https';
import { logger } from 'firebase-functions';

type Params = Record<string, string | number>;

export const weatherDescription = onCall(async (request: CallableRequest<Params>) => {
  logger.info('weatherDescription', request.data);
  logger.info('Key', process.env['OPENAI_API_KEY']);

  return 'sunny';
});
