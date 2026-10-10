import { buildInterimResult, mapper } from '@f2020/data';
import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { DateTime } from 'luxon';
import { getCurrentRace, getDrivers, openF1Api, serverToken } from '../../lib';
import { createInterimResult } from './interim-result.call';

/**
 * Creates the interim result from the qualifying before the race is live, when it has not been submitted.
 * The live race shows the places moved from it. It starts two hours before the race, so a failure is tried again before the race is live
 */
export const interimResultCrontab = onSchedule({
    timeZone: 'Europe/Copenhagen',
    schedule: '*/15 * * * *',
  }, async () => {
    const race = await getCurrentRace('closed');
    if (!race || race.result || race.raceStart.minus({ hours: 2 }) > DateTime.local()) {
      return;
    }
    if (!race.circuitId) {
      logger.warn(`${race.name} has no circuit, so the qualifying cannot be found`);
      return;
    }
    const token = await serverToken();
    const session = await openF1Api.session(token, race.season, race.circuitId, 'Qualifying');
    const sessionResults = session ? await openF1Api.sessionResults(token, session.session_key) : [];
    if (!sessionResults.length) {
      logger.info(`No qualifying results for ${race.name}`);
      return;
    }
    const qualify = mapper.qualifyResult({ sessionResults, race, drivers: await getDrivers() });
    logger.info(`Creating the interim result for ${race.name}`);
    await createInterimResult(race, buildInterimResult(qualify, race.selectedDriver, race.selectedTeam!));
  },
);
