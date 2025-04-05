import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { collectionData, doc, docData, Firestore, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Bid, converter, firestoreWebUtils, IDriver, IPitStop, IQualifyResult, IRace, IRaceResult, ITeam, mapper, Participant, Player, RoundResult, TeamRadio } from '@f2020/data';
import { Lap, openF1Url, PitStop, Position, Session, TeamRadio as OpenF1TeamRadio } from '@f2020/openf1';
import { requiredValue, unfreeze } from '@f2020/tools';
import { collection } from 'firebase/firestore';
import { DateTime } from 'luxon';
import { combineLatest, Observable, of, scan, switchMap, takeWhile, tap, timer } from 'rxjs';
import { exhaustMap, map, shareReplay } from 'rxjs/operators';
import { SeasonService } from '../../season/service/season.service';

const bidConverter = converter.timestamp<Bid>();
const toISOOptions = { includeOffset: false, suppressMilliseconds: true };
const sessionKey = (race: IRace, session: 'Race' | 'Qualifying') => `${session}-${race.circuitId}`;
const sessionCache = new Map<string, Observable<Session>>();

@Injectable({
  providedIn: 'root',
})
export class RacesService {

  constructor(
    private afs: Firestore,
    private http: HttpClient,
    private functions: Functions) {
  }

  getRaces(seasonId: string): Observable<IRace[]> {
    return collectionData(collection(this.afs, `${SeasonService.seasonsURL}/${seasonId}/races`).withConverter(converter.timestamp<IRace>())).pipe(
      map(races => races.sort((a, b) => a.round - b.round)),
    );
  }

  getBids(seasonId: string, race: IRace | string): Observable<Bid[]> {
    const round = typeof race === 'string' ? race : race.round;
    return collectionData(collection(this.afs, `${SeasonService.seasonsURL}/${seasonId}/races/${round}/bids`).withConverter(bidConverter));
  }

  getParticipants(seasonId: string, race: IRace | string): Observable<Participant[]> {
    const round = typeof race === 'string' ? race : race.round;
    return collectionData(collection(this.afs, `${SeasonService.seasonsURL}/${seasonId}/races/${round}/participants`).withConverter(bidConverter));
  }

  getBid(seasonId: string | number, round: number, uid: string): Observable<Bid> {
    return docData(doc(this.afs, `${SeasonService.seasonsURL}/${seasonId}/races/${round}/bids/${uid}`).withConverter(bidConverter));
  }

  updateRace(seasonId: string, round: number | string, race: Partial<IRace>): Promise<void> {
    return updateDoc(doc(this.afs, `${SeasonService.seasonsURL}/${seasonId}/races/${round}`), race);
  }

  updateBid(seasonId: string, round: number | string, player: Player, bid: Bid): Promise<void> {
    return setDoc(doc(this.afs, `${SeasonService.seasonsURL}/${seasonId}/races/${round}/bids/${player.uid}`).withConverter(bidConverter), {
      ...bid,
      player: {
        uid: player.uid,
        displayName: player.displayName,
        photoURL: player.photoURL,
        email: player.email,
      },
    });
  }

  getResult(race: IRace, drivers: IDriver[]): Observable<IRaceResult | null> {
    return this.#getSession(race, 'Race').pipe(
      switchMap(session => this.#getPositionAndLabs(race, session.session_key)),
      map(({ positions, laps }) => mapper.raceResult({ positions, laps, race, drivers })),
    );
  }

  getLiveResult(race: IRace, drivers: IDriver[]): Observable<{ result: IRaceResult, latestUpdate: DateTime; } | null> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const isLiveLive = DateTime.now().toUTC() < latestEndTime;
    let positionAfter: DateTime | undefined = undefined;
    let labsAfter: DateTime | undefined = undefined;
    return isLiveLive
      ? this.#getSession(race, 'Race').pipe(
        switchMap(session => timer(0, 5000).pipe(
          map(() => session.session_key),
        )),
        takeWhile(() => DateTime.local() < latestEndTime),
        exhaustMap(sessionKey => this.#getPositionAndLabs(race, sessionKey, positionAfter, labsAfter)),
        tap(({ positions, laps }) => {
          positionAfter = positions?.length ? DateTime.fromISO(positions.at(-1).date) : positionAfter;
          labsAfter = laps?.length ? DateTime.fromISO(laps.at(-1).date_start) : labsAfter;
        }),
        scan((previous, current) => ({
          positions: [...previous.positions, ...current.positions ?? []],
          laps: [...previous.laps, ...current.laps ?? []],
        })),
        map(({ positions, laps }) => {
          const { result, ...raceNoResult } = race;
          return mapper.raceResult({ positions, laps, race: raceNoResult, drivers });
        }),
        map(result => ({ result, latestUpdate: positionAfter > labsAfter ? positionAfter : labsAfter })),
      )
      : this.#replayResult(race, drivers);
  }

  getLiveRadio(race: IRace, drivers: IDriver[]): Observable<TeamRadio[] | null> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const isLiveLive = DateTime.now().toUTC() < latestEndTime;
    let positionAfter: DateTime | undefined = undefined;

    return isLiveLive
      ? this.#getSession(race, 'Race').pipe(
        switchMap(session => timer(0, 5000).pipe(
          map(() => session.session_key),
        )),
        takeWhile(() => DateTime.local() < latestEndTime),
        exhaustMap(sessionKey => this.#getTeamRadio(race, sessionKey, positionAfter)),
        tap(messages => positionAfter = messages?.length ? DateTime.fromISO(messages.at(-1).date) : positionAfter),
        map(messages => mapper.radio({ messages, drivers })),
        scan((previous, current) => [...previous, ...current]),
        map(messages => messages.toSorted((a, b) => b.date.valueOf() - a.date.valueOf())),
      )
      : this.#replayRadio(race, drivers);
  }

  getQualify(race: IRace, drivers: IDriver[]): Observable<IQualifyResult | undefined> {
    return this.#getSession(race, 'Qualifying').pipe(
      switchMap(session => this.#getPositionAndLabs(race, session.session_key)),
      map(({ positions, laps }) => mapper.qualifyResult({ positions, laps, race, drivers })),
    );
  }

  getPitStops(race: IRace, drivers: IDriver[], teams: ITeam[]): Observable<IPitStop[]> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const positionFilter = `&date<=${latestEndTime.toISO(toISOOptions)}`;

    return this.#getSession(race, 'Race').pipe(
      map(session => requiredValue(session.session_key, 'session_key')),
      switchMap(session => this.http.get<PitStop[]>(openF1Url.pitStops(session) + positionFilter)),
      map(pitStops => mapper.pitStops({ pitStops, drivers, teams })),
    );
  }

  getLivePitStops(race: IRace, drivers: IDriver[], teams: ITeam[]): Observable<IPitStop[]> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const isLiveLive = DateTime.now().toUTC() < latestEndTime;
    const positionFilter = `&date<=${latestEndTime.toISO(toISOOptions)}`;

    return this.#getSession(race, 'Race').pipe(
      map(session => requiredValue(session.session_key, 'session_key')),
      switchMap(sessionKey => {

        let replaceDate: DateTime = race.raceStart.toUTC().minus({ hour: 1 });

        return isLiveLive
          ? timer(0, 5000).pipe(
            takeWhile(() => DateTime.local() < latestEndTime),
            exhaustMap(() => this.http.get<PitStop[]>(openF1Url.pitStops(sessionKey) + positionFilter)),
          )
          : this.http.get<PitStop[]>(openF1Url.pitStops(sessionKey) + positionFilter).pipe(
            switchMap(pitStops => {
              return timer(0, 500).pipe(
                takeWhile(() => replaceDate < latestEndTime),
                map(() => pitStops.filter(p => !p.date || DateTime.fromISO(p.date) <= replaceDate)),
                tap(() => replaceDate = replaceDate.plus({ minute: 5 })),
              );
            }));
      }),
      map(pitStops => mapper.pitStops({ pitStops, drivers, teams })),
    );
  }

  getLastYearResult(seasonId: number, circuitId: string): Promise<RoundResult> {
    return getDoc(doc(this.afs, `${SeasonService.seasonsURL}/${seasonId}/lastYear/${circuitId}`)).then(
      snapshot => snapshot.data() as RoundResult,
    );
  }

  async submitBid(bid: Bid, player: Player): Promise<true> {
    return httpsCallable(this.functions, 'submitBid')({
      ...bid, player: {
        uid: player.uid,
        displayName: player.displayName,
        photoURL: player.photoURL,
        tokens: player.tokens,
        email: player.email,
      },
      version: 2,
    }).then(() => true);
  }

  async updateRaceV2(race: IRace): Promise<true> {
    return httpsCallable(this.functions, 'updateRace')({
      ...firestoreWebUtils.convertToJSON(unfreeze(race)),
      version: 2,
    }).then(() => true);
  }

  async submitResult(round: number, result: Bid): Promise<true> {
    return httpsCallable(this.functions, 'submitResult')(({ round, result })).then(() => true);
  }

  async submitInterimResult(result: Partial<Bid>): Promise<true> {
    return httpsCallable(this.functions, 'submitInterimResult')(result).then(() => true);
  }

  async rollbackResult(round: number): Promise<true> {
    return httpsCallable(this.functions, 'rollbackResult')(round).then(() => true);
  }

  async cancelRace(round: number): Promise<true> {
    return httpsCallable(this.functions, 'cancelRace')(round).then(() => true);
  }

  #getSession(race: IRace, sessionName: 'Race' | 'Qualifying'): Observable<Session> {
    const key = sessionKey(race, sessionName);
    if (!sessionCache.has(key)) {
      const session = JSON.parse(localStorage.getItem(key)) as Session | null;
      const session$ = session
        ? of(session)
        : this.http.get<Session[]>(openF1Url.session(race.season, race.circuitId, sessionName)).pipe(
          map(sessions => requiredValue(sessions[0], 'Session')),
          tap(session => localStorage.setItem(key, JSON.stringify(session))),
          shareReplay(1),
        );
      sessionCache.set(key, session$);
    }
    return sessionCache.get(key);
  }

  #getPositionAndLabs(race: IRace, sessionKey: number, positionAfter?: DateTime, lapsAfter?: DateTime): Observable<{ positions: Position[], laps: Lap[]; }> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const positionQuery = `&date<=${latestEndTime.toISO(toISOOptions)}` + (positionAfter ? `&date_start>=${positionAfter.toISO(toISOOptions)}` : '');
    const lapsQuery = `&date_start<=${latestEndTime.toISO(toISOOptions)}` + (lapsAfter ? `&date_start>=${lapsAfter.toISO(toISOOptions)}` : '');
    return combineLatest({
      positions: this.http.get<Position[]>(openF1Url.positions(sessionKey) + positionQuery),
      laps: this.http.get<Lap[]>(openF1Url.labs(sessionKey) + lapsQuery),
    });
  }

  #getTeamRadio(race: IRace, sessionKey: number, positionAfter?: DateTime): Observable<OpenF1TeamRadio[]> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const positionQuery = `&date<=${latestEndTime.toISO(toISOOptions)}` + (positionAfter ? `&date_start>=${positionAfter.toISO(toISOOptions)}` : '');
    return this.http.get<OpenF1TeamRadio[]>(openF1Url.radio(sessionKey) + positionQuery);
  }

  #replayResult(race: IRace, drivers: IDriver[]): Observable<{ result: IRaceResult, latestUpdate: DateTime; } | null> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    let date = race.raceStart.toUTC().minus({ hour: 1 });
    return this.#getSession(race, 'Race').pipe(
      switchMap(session => this.#getPositionAndLabs(race, session.session_key)),
      switchMap(({ positions, laps }) => {
        return timer(0, 500).pipe(
          takeWhile(() => date < latestEndTime),
          map(() => ({
            positions: positions.filter(p => !p.date || DateTime.fromISO(p.date) <= date),
            laps: laps.filter(l => !l.date_start || DateTime.fromISO(l.date_start) <= date),
          })),
          tap(() => date = date.plus({ minute: 5 })),
          map(({ positions, laps }) => {
            const { result, ...raceNoResult } = race;
            return mapper.raceResult({ positions, laps, race: raceNoResult, drivers });
          }),
          map(result => ({ result, latestUpdate: date })),
        );
      }),
    );
  }

  #replayRadio(race: IRace, drivers: IDriver[]): Observable<TeamRadio[] | null> {
    return this.#getSession(race, 'Race').pipe(
      switchMap(session => this.#getTeamRadio(race, session.session_key)),
      map(messages => mapper.radio({ messages, drivers }).toSorted((a, b) => b.date.valueOf() - a.date.valueOf())),
    );
  }
}
