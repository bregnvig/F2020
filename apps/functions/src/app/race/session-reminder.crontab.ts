import { IRace, IRaceSession, Player, sessionId, sessionName } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { DateTime } from 'luxon';
import { appLink, collectionPaths, converter, getCurrentRace, sendNotification } from '../../lib';

/** The crontab runs 5 minutes before the hour and the half hour, when the sessions start */
const ahead = { minutes: 5 };

export interface SessionReminder {
  tokens: string[];
  title: string;
  body: string;
  link: string;
}

/** The race and the qualifying have their own live pages. The other sessions are followed on the page of the session */
const sessionLink = (race: IRace, session: IRaceSession) =>
  session.type === 'race'
    ? appLink(race.season, 'race', race.round, 'live')
    : session.type === 'qualifying'
      ? appLink(race.season, 'race', race.round, 'live', 'qualify')
      : appLink(race.season, 'race', race.round, 'session', sessionId(session));

/** The sessions starting within the next 5 minutes, each to the players who want a reminder of that kind of session */
export const sessionReminders = (race: IRace, players: Player[], now: DateTime): SessionReminder[] =>
  (race.schedule ?? [])
    .filter(session => session.start > now && session.start <= now.plus(ahead))
    .flatMap(session => {
      const tokens = players.filter(player => player.sessionReminders?.includes(session.type)).flatMap(player => player.tokens ?? []);
      const time = session.start.setZone('Europe/Copenhagen').toFormat('HH:mm');
      return tokens.length ? [{ tokens, title: `${sessionName(session)} starter kl. ${time}`, body: race.name, link: sessionLink(race, session) }] : [];
    });

// Every half hour from Friday to Sunday, when the sessions of a weekend are driven
export const sessionReminderCrontab = onSchedule(
  {
    timeZone: 'Europe/Copenhagen',
    schedule: '25,55 * * * 5,6,0',
  },
  async () => {
    // The race is closed before the qualifying, but still open during the practices
    const race = (await getCurrentRace('closed')) ?? (await getCurrentRace('open'));
    if (!race) {
      logger.info('No current race');
      return;
    }
    const players = await getFirestore()
      .collection(collectionPaths.players())
      .withConverter<Player>(converter.timestamp)
      .get()
      .then(snapshot => snapshot.docs.map(doc => doc.data()));
    const reminders = sessionReminders(race, players, DateTime.now());
    if (!reminders.length) {
      logger.info(`No session of ${race.name} starts within ${ahead.minutes} minutes`);
    }
    await Promise.all(reminders.map(({ tokens, title, body, link }) => sendNotification(tokens, title, body, { link })));
  },
);
