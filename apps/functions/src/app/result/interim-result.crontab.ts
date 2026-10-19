import { buildInterimResult, mapper } from '@f2020/data';
import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { DateTime } from 'luxon';
import { getCurrentRace, getDrivers, openF1Api, serverToken } from '../../lib';
import { createInterimResult } from './interim-result.call';

/**
 * Creates the interim result from the qualifying, when it has not been submitted. It is created an hour after the qualifying, so
 * OpenF1 has the final results, and it is there before the race is live, which shows the places moved from it.
 * Nothing is fetched from OpenF1 until two days before the race, as the qualifying is the day before
 */
export const interimResultCrontab = onSchedule(
  {
    timeZone: 'Europe/Copenhagen',
    schedule: '*/15 * * * *',
  },
  async () => {
    const race = await getCurrentRace('closed');
    if (!race || race.result || race.raceStart.minus({ days: 2 }) > DateTime.local()) {
      return;
    }
    if (!race.circuitId) {
      logger.warn(`${race.name} has no circuit, so the qualifying cannot be found`);
      return;
    }
    const token = await serverToken();
    const session = await openF1Api.session(token, race.season, race.circuitId, 'Qualifying');
    if (!session || DateTime.fromISO(session.date_end).plus({ hours: 1 }) > DateTime.local()) {
      return;
    }
    const sessionResults = await openF1Api.sessionResults(token, session.session_key);
    if (!sessionResults.length) {
      logger.info(`No qualifying results for ${race.name}`);
      return;
    }
    const qualify = mapper.qualifyResult({ sessionResults, race, drivers: await getDrivers() });
    logger.info(`Creating the interim result for ${race.name}`);
    await createInterimResult(race, buildInterimResult(qualify, race.selectedDriver, race.selectedTeam!));
  },
);
