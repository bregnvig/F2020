import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Session } from '@f2020/openf1';
import { truthy } from '@f2020/tools';
import { DateTime } from 'luxon';
import { firstValueFrom, switchMap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { RaceStore } from '../+state';
import { OpenF1HttpService } from './openf1-http.service';

/** The route data with the qualifying session, which tells if the qualifying is live */
export const qualifySessionData = 'qualifySession';

/** Live from an hour before the qualifying until an hour after it is planned to end, to allow for red flags */
export const isQualifyLive = (session: Session, now = DateTime.now()) =>
  DateTime.fromISO(session.date_start).minus({ hour: 1 }) < now && DateTime.fromISO(session.date_end).plus({ hour: 1 }) > now;

/** True when the qualifying can be seen, live or as a replay */
export const isQualifyStarted = (session: Session, now = DateTime.now()) => DateTime.fromISO(session.date_start).minus({ hour: 1 }) < now;

export const qualifySessionResolver: ResolveFn<Session> = () => {
  const store = inject(RaceStore);
  const openF1 = inject(OpenF1HttpService);
  return firstValueFrom(toObservable(store.race).pipe(
    truthy(),
    switchMap(race => openF1.getSession(race, 'Qualifying')),
  ));
};
