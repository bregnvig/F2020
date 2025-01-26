import { Injectable } from '@angular/core';
import { collectionData, doc, docData, Firestore, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Bid, converter, firestoreWebUtils, IDriver, IPitStop, IQualifyResult, IRace, IRaceResult, ITeam, mapper, Participant, Player, RoundResult } from '@f2020/data';
import { requiredValue, unfreeze } from '@f2020/tools';
import { collection } from 'firebase/firestore';
import { combineLatest, Observable, switchMap, takeWhile, tap, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { SeasonService } from '../../season/service/season.service';
import { HttpClient } from '@angular/common/http';
import { Lap, openF1, PitStop, Position, Session } from '@f2020/openf1';
import { DateTime } from 'luxon';

const bidConverter = converter.timestamp<Bid>();
const toISOOptions = { includeOffset: false, suppressMilliseconds: true };

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

  getBids(seasonId: string, race: IRace | string, uid: string): Observable<Bid[]> {
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
    return this.#getPositionAndLabs(race, 'Race').pipe(
      map(({ positions, laps }) => mapper.raceResult({ positions, laps, race, drivers })),
    );
  }

  getLiveResult(race: IRace, drivers: IDriver[]): Observable<{ result: IRaceResult, latestUpdate: DateTime } | null> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const isLiveLive = DateTime.now().toUTC() < latestEndTime;
    return isLiveLive
      ? timer(0, 5000).pipe(
        takeWhile(() => DateTime.local() < latestEndTime),
        switchMap(() => this.#getPositionAndLabs(race, 'Race')),
        map(({ positions, laps }) => {
          const { result, ...raceNoResult } = race;
          return mapper.raceResult({ positions, laps, race: raceNoResult, drivers });
        }),
        map(result => ({ result, latestUpdate: DateTime.local() })),
      )
      : this.#replayResult(race, drivers);
  }

  getQualify(race: IRace, drivers: IDriver[]): Observable<IQualifyResult | undefined> {
    return this.#getPositionAndLabs(race, 'Qualifying').pipe(
      map(({ positions, laps }) => mapper.qualifyResult({ positions, laps, race, drivers })),
    );
  }

  getPitStops(race: IRace, drivers: IDriver[], teams: ITeam[]): Observable<IPitStop[]> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const positionFilter = `&date<=${latestEndTime.toISO(toISOOptions)}`;

    return this.http.get<Session[]>(openF1.url.session(race.season, race.circuitId, 'Race')).pipe(
      map(sessions => requiredValue(sessions[0].session_key, 'session_key')),
      switchMap(session => this.http.get<PitStop[]>(openF1.url.pitStops(session) + positionFilter)),
      map(pitStops => mapper.pitStops({ pitStops, drivers, teams })),
    );
  }

  getLivePitStops(race: IRace, drivers: IDriver[], teams: ITeam[]): Observable<IPitStop[]> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const isLiveLive = DateTime.now().toUTC() < latestEndTime;
    const positionFilter = `&date<=${latestEndTime.toISO(toISOOptions)}`;

    return this.http.get<Session[]>(openF1.url.session(race.season, race.circuitId, 'Race')).pipe(
      map(sessions => requiredValue(sessions[0].session_key, 'session_key')),
      switchMap(sessionKey => {

        let replaceDate: DateTime = race.raceStart.toUTC().minus({ hour: 1 });

        return isLiveLive
          ? timer(0, 5000).pipe(
            takeWhile(() => DateTime.local() < latestEndTime),
            switchMap(() => this.http.get<PitStop[]>(openF1.url.pitStops(sessionKey) + positionFilter)),
          )
          : this.http.get<PitStop[]>(openF1.url.pitStops(sessionKey) + positionFilter).pipe(
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
    const u = unfreeze;
    return httpsCallable(this.functions, 'updateRace')({
      ...firestoreWebUtils.convertToJSON(u(race)),
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

  #getPositionAndLabs(race: IRace, sessionName: 'Race' | 'Qualifying'): Observable<{ positions: Position[], laps: Lap[] }> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const positionQuery = `&date<=${latestEndTime.toISO(toISOOptions)}`;
    const lapsQuery = `&date_start<=${latestEndTime.toISO(toISOOptions)}`;
    return this.http.get<Session[]>(openF1.url.session(race.season, race.circuitId, sessionName)).pipe(
      map(sessions => requiredValue(sessions[0], 'Session')),
      switchMap(session => {
        return combineLatest({
          positions: this.http.get<Position[]>(openF1.url.positions(session.session_key) + positionQuery),
          laps: this.http.get<Lap[]>(openF1.url.labs(session.session_key) + lapsQuery),
        });
      }),
    );
  }

  #replayResult(race: IRace, drivers: IDriver[]): Observable<{ result: IRaceResult, latestUpdate: DateTime } | null> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    let date = race.raceStart.toUTC().minus({ hour: 1 });
    return this.#getPositionAndLabs(race, 'Race').pipe(
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
}
