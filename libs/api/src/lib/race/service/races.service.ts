import { Injectable } from '@angular/core';
import { collectionData, doc, docData, Firestore, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Bid, converter, firestoreWebUtils, IDriver, IPitStop, IQualifyResult, IRace, IRaceResult, ITeam, mapper, Participant, Player, RoundResult } from '@f2020/data';
import { deepCompare, requiredValue, unfreeze } from '@f2020/tools';
import { collection } from 'firebase/firestore';
import { combineLatest, Observable, scan, switchMap, takeWhile, tap, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { SeasonService } from './../../season/service/season.service';
import { HttpClient } from '@angular/common/http';
import { Lap, openF1, PitStop, Position, Session } from '@f2020/openf1';
import { DateTime } from 'luxon';

const bidConverter = converter.timestamp<Bid>();
const toISOOptions = { includeOffset: false, suppressMilliseconds: true };

const getLatestDate = (dates: string[]): DateTime | undefined => {
  return dates.length
    ? dates
      .map(date => DateTime.fromISO(date, { zone: 'utc' }))
      .reduce((acc, date) => date > acc ? date : acc, DateTime.fromISO(dates[0], { zone: 'utc' }))
    : undefined;
};

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

  getLiveResult(race: IRace, drivers: IDriver[]): Observable<IRaceResult | null> {
    const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
    const isLiveLive = DateTime.now().toUTC() < latestEndTime;
    let positionLatestDate: DateTime = isLiveLive ? DateTime.now().toUTC() : race.raceStart.toUTC().minus({ hour: 1 });
    let lapsLatestDate: DateTime = isLiveLive ? DateTime.now().toUTC() : race.raceStart.toUTC().minus({ hour: 1 });
    let positionStep = 10;
    let lapsStep = 10;
    return timer(0, isLiveLive ? 5000 : 2500).pipe(
      takeWhile(() => positionLatestDate.plus({ minute: positionStep }) < latestEndTime && lapsLatestDate.plus({ minute: lapsStep }) < latestEndTime),
      switchMap(() => this.#getPositionAndLabs(
        race,
        'Race',
        `&date>=${positionLatestDate.toISO(toISOOptions)}&date<=${positionLatestDate.plus({ minute: positionStep }).toISO(toISOOptions)}`,
        `&date_start>=${lapsLatestDate.toISO(toISOOptions)}&date_start<=${lapsLatestDate.plus(({ minute: lapsStep })).toISO(toISOOptions)}`),
      ),
      tap(current => {
        positionStep = current.positions.length ? 5 : positionStep + 10;
        lapsStep = current.laps.length ? 5 : lapsStep + 10;
        positionLatestDate = (getLatestDate(current.positions.map(p => p.date)) ?? positionLatestDate).plus({ second: 1 });
        lapsLatestDate = (getLatestDate(current.laps.map(p => p.date_start)) ?? lapsLatestDate).plus({ second: 1 });
      }),

      scan((old, current) => {
        const positions: Position[] = [...old.positions, ...(current.positions.filter(p => !old.positions.some(op => deepCompare(op, p))))];
        const laps: Lap[] = [...old.laps, ...(current.laps.filter(p => !old.laps.some(ol => deepCompare(ol, p))))];
        return { positions, laps };
      }),
      map(({ positions, laps }) => {
        const { result, ...raceNoResult } = race;
        return mapper.raceResult({ positions, laps, race: raceNoResult, drivers });
      }),
    );
  }

  getQualify(race: IRace, drivers: IDriver[]): Observable<IQualifyResult | undefined> {
    return this.#getPositionAndLabs(race, 'Qualifying').pipe(
      map(({ positions, laps }) => mapper.qualifyResult({ positions, laps, race, drivers })),
    );
  }

  getPitStops(race: IRace, drivers: IDriver[], teams: ITeam[]): Observable<IPitStop[]> {
    return this.http.get<Session[]>(openF1.url.session(race.season, race.circuitId, 'Race')).pipe(
      map(sessions => requiredValue(sessions[0].session_key, 'session_key')),
      switchMap(session => this.http.get<PitStop[]>(openF1.url.pistops(session))),
      map(pitStops => mapper.pitStops({ pitStops, drivers, teams })),
    );
  }

  getLivePitStops(race: IRace, drivers: IDriver[], teams: ITeam[]): Observable<IPitStop[]> {

    return this.http.get<Session[]>(openF1.url.session(race.season, race.circuitId, 'Race')).pipe(
      map(sessions => requiredValue(sessions[0].session_key, 'session_key')),
      switchMap(sessionKey => {
        const latestEndTime = race.raceStart.toUTC().plus({ hour: 3 });
        const isLiveLive = DateTime.now().toUTC() < latestEndTime;

        let pitStep = 10;
        let latest: DateTime = isLiveLive ? DateTime.now().toUTC() : race.raceStart.toUTC().minus({ hour: 1 });

        return timer(0, isLiveLive ? 5000 : 2500).pipe(
          takeWhile(() => latest.plus({ minute: pitStep }) < latestEndTime),
          switchMap(() => this.http.get<PitStop[]>(
            openF1.url.pistops(sessionKey) + `&date>=${latest.toISO(toISOOptions)}&date<=${latest.plus({ minute: pitStep }).toISO(toISOOptions)}`),
          ),
          tap(current => {
            pitStep = current.length ? 5 : pitStep + 10;
            latest = (getLatestDate(current.map(p => p.date)) ?? latest).plus({ second: 1 });
          }),
          scan((old, current) => [...old, ...(current.filter(p => !old.some(op => deepCompare(op, p))))]),
        );
      }),
      map(pitStops => mapper.pitStops({ pitStops, drivers, teams })),
    );
  }

  getLastYearResult(seasonId: number, countryCode: string): Promise<RoundResult> {
    return getDoc(doc(this.afs, `${SeasonService.seasonsURL}/${seasonId}/lastYear/${countryCode}`)).then(
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

  #getPositionAndLabs(race: IRace, sessionName: 'Race' | 'Qualifying', positionQuery = '', lapsQuery = ''): Observable<{ positions: Position[], laps: Lap[] }> {
    return this.http.get<Session[]>(openF1.url.session(race.season, race.circuitId, sessionName)).pipe(
      map(sessions => requiredValue(sessions[0].session_key, 'session_key')),
      switchMap(sessionKey => combineLatest({
        positions: this.http.get<Position[]>(openF1.url.positions(sessionKey) + positionQuery),
        laps: this.http.get<Lap[]>(openF1.url.labs(sessionKey) + lapsQuery),
      })),
    );
  }
}
