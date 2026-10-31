import { IDriverSessionResult, IRace, IRaceSession, ISessionResult, mapper, sessionId } from '@f2020/data';
import { Driver, openF1Url, Session, SessionName, SessionResult } from '@f2020/openf1';
import { getFirestore } from 'firebase-admin/firestore';
import { CallableRequest, onCall } from 'firebase-functions/v2/https';
import { DateTime } from 'luxon';
import { converter, documentPaths, internalError, logAndCreateError, openF1List, validateAccess } from '../../lib';

const openF1ApiUrl = 'https://api.openf1.org/v1/';
const list = <T>(url: string) => openF1List<T>(url.replace(openF1ApiUrl, ''));

/** OpenF1 may correct a result, e.g. after a penalty, for a while after the session */
const storeAfter = { hours: 1 };

const sessionNames: Record<Exclude<IRaceSession['type'], 'practice'>, SessionName> = {
  'sprint-qualifying': 'Sprint Qualifying',
  sprint: 'Sprint',
  qualifying: 'Qualifying',
  race: 'Race',
};

const openF1SessionName = (session: IRaceSession): SessionName => (session.type === 'practice' ? (`Practice ${session.number}` as SessionName) : sessionNames[session.type]);

const fetchResult = async (race: IRace, session: IRaceSession): Promise<ISessionResult> => {
  const [openF1Session] = await list<Session>(openF1Url.session(race.season, race.circuitId, openF1SessionName(session)));
  if (!openF1Session) {
    throw logAndCreateError('not-found', `No OpenF1 session ${openF1SessionName(session)} for ${race.season} round ${race.round}`);
  }
  const [sessionResults, drivers] = await Promise.all([
    list<SessionResult>(openF1Url.sessionResults(openF1Session.session_key)),
    list<Driver>(openF1Url.driver(openF1Session.session_key)),
  ]);
  return mapper.sessionResult({ session, sessionResults, drivers });
};

/**
 * The result of a session of the weekend that is over. It is fetched from OpenF1 the first time, and stored under the race, so later
 * calls read it from Firestore. It is only stored a while after the session, as OpenF1 may correct it, and when there is a result.
 * Only the results are returned, as a callable can't send a DateTime, and the app has the session in the schedule of the race
 */
export const sessionResultCall = onCall(async (request: CallableRequest<{ season: number; round: number; session: string }>): Promise<IDriverSessionResult[]> => {
  return validateAccess(request.auth?.uid, 'player')
    .then(async () => {
      const { season, round, session: id } = request.data ?? {};
      const race = await getFirestore()
        .doc(documentPaths.race(season, round))
        .withConverter<IRace>(converter.timestamp)
        .get()
        .then(snapshot => snapshot.data());
      const session = race?.schedule?.find(s => sessionId(s) === id);
      if (!race || !session) {
        throw logAndCreateError('not-found', `No session ${id} in ${season} round ${round}`);
      }
      if (session.end > DateTime.now()) {
        throw logAndCreateError('failed-precondition', `Session ${id} in ${season} round ${round} is not over`);
      }
      const doc = getFirestore()
        .doc(documentPaths.sessionResult(season, round, id))
        .withConverter<ISessionResult>(converter.timestamp);
      const stored = await doc.get().then(snapshot => snapshot.data());
      if (stored) {
        return stored.results;
      }
      const result = await fetchResult(race, session);
      if (result.results.length && session.end.plus(storeAfter) < DateTime.now()) {
        await doc.set(result);
      }
      return result.results;
    })
    .catch(internalError);
});
