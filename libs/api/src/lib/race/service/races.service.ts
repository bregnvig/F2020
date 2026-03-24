import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { collection, collectionData, doc, docData, Firestore, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Bid, IDriver, IPitStop, IQualifyResult, IRace, IRaceResult, ITeam, mapper, Participant, Player, RoundResult } from '@f2020/data';
import { requiredValue, unfreeze } from '@f2020/tools';
import { combineLatest, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { SeasonService } from '../../season/service/season.service';
import { OpenF1HttpService } from './openf1-http.service';
import { converter } from '../../converter';
import { firestoreWebUtils } from '../../firestore-utils';

const bidConverter = converter.timestamp<Bid>();

@Injectable({
  providedIn: 'root',
})
export class RacesService {

  #firestore = inject(Firestore);
  #http = inject(HttpClient);
  #functions = inject(Functions);

  #openF1HttpService = inject(OpenF1HttpService);


  getRaces(seasonId: string): Observable<IRace[]> {
    return collectionData(collection(this.#firestore, `${SeasonService.seasonsURL}/${seasonId}/races`).withConverter(converter.timestamp<IRace>())).pipe(
      map((races: IRace[]) => races.sort((a, b) => a.round - b.round)),
    );
  }

  getBids(seasonId: string, race: IRace | string): Observable<Bid[]> {
    const round = typeof race === 'string' ? race : race.round;
    return collectionData(collection(this.#firestore, `${SeasonService.seasonsURL}/${seasonId}/races/${round}/bids`).withConverter(bidConverter)).pipe(
      map(bids => bids as Bid[]),
    );
  }

  getParticipants(seasonId: string, race: IRace | string): Observable<Participant[]> {
    const round = typeof race === 'string' ? race : race.round;
    return collectionData(collection(this.#firestore, `${SeasonService.seasonsURL}/${seasonId}/races/${round}/participants`).withConverter(bidConverter)).pipe(
      map(participants => participants as Participant[]),
    );
  }

  getBid(seasonId: string | number, round: number, uid: string): Observable<Bid> {
    return docData(doc(this.#firestore, `${SeasonService.seasonsURL}/${seasonId}/races/${round}/bids/${uid}`).withConverter(bidConverter)).pipe(
      map(bid => bid as Bid),
    );
  }

  updateRace(seasonId: string, round: number | string, race: Partial<IRace>): Promise<void> {
    return updateDoc(doc(this.#firestore, `${SeasonService.seasonsURL}/${seasonId}/races/${round}`), race);
  }

  updateBid(seasonId: string, round: number | string, player: Player, bid: Bid): Promise<void> {
    return setDoc(doc(this.#firestore, `${SeasonService.seasonsURL}/${seasonId}/races/${round}/bids/${player.uid}`).withConverter(bidConverter), {
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
    const qualifyKey$ = this.#openF1HttpService.getSession(race, 'Qualifying').pipe(map(session => requiredValue(session.session_key, 'session_key')));
    const raceKey$ = this.#openF1HttpService.getSession(race, 'Race').pipe(map(session => requiredValue(session.session_key, 'session_key')));
    return combineLatest({
      qualifyKey: qualifyKey$,
      raceKey: raceKey$,
    }).pipe(
      switchMap(({ raceKey, qualifyKey }) => combineLatest({
        gridPositions: this.#openF1HttpService.getStartingGrid(qualifyKey).pipe(
          map(positions => mapper.grid({ positions, drivers })),
        ),
        sessionResults: this.#openF1HttpService.getSessionResult(raceKey),
        laps: this.#openF1HttpService.getLaps(raceKey),
      })),
      map(({ sessionResults, gridPositions, laps }) => {
        if (!sessionResults.length) throw new Error('No session results found for race');
        if (!gridPositions.length) throw new Error('No grid positions found for race');
        if (!laps.length) throw new Error('No laps found for race');
        return mapper.raceResult({ gridPositions, sessionResults, race, drivers, laps });
      }),
    );
  }

  getQualify(race: IRace, drivers: IDriver[]): Observable<IQualifyResult | undefined> {
    return this.#openF1HttpService.getSession(race, 'Qualifying').pipe(
      switchMap(session => this.#openF1HttpService.getSessionResult(session.session_key)),
      map(sessionResults => {
        if (!sessionResults.length) throw new Error('No session results found qualifying');
        return mapper.qualifyResult({ sessionResults, race, drivers });
      }),
    );
  }

  getPitStops(race: IRace, drivers: IDriver[], teams: ITeam[]): Observable<IPitStop[]> {
    return this.#openF1HttpService.getSession(race, 'Race').pipe(
      map(session => requiredValue(session.session_key, 'session_key')),
      switchMap(session => this.#openF1HttpService.getPitStops(session)),
      map(pitStops => mapper.pitStops({ pitStops, drivers, teams })),
    );
  }

  getLastYearResult(seasonId: number, circuitId: string): Promise<RoundResult> {
    return getDoc(doc(this.#firestore, `${SeasonService.seasonsURL}/${seasonId}/lastYear/${circuitId}`)).then(
      snapshot => snapshot.data() as RoundResult,
    );
  }

  updateStandings(race: IRace): Promise<unknown> {
    return httpsCallable(this.#functions, 'standingCall')(race).then(() => true);
  }

  async submitBid(bid: Bid, player: Player): Promise<true> {
    return httpsCallable(this.#functions, 'submitBid')({
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
    return httpsCallable(this.#functions, 'updateRace')({
      ...firestoreWebUtils.convertToJSON(unfreeze(race)),
      version: 2,
    }).then(() => true);
  }

  async submitResult(round: number, result: Bid): Promise<true> {
    return httpsCallable(this.#functions, 'submitResult')(({ round, result })).then(() => true);
  }

  async submitInterimResult(result: Partial<Bid>): Promise<true> {
    return httpsCallable(this.#functions, 'submitInterimResult')(result).then(() => true);
  }

  async rollbackResult(round: number): Promise<true> {
    return httpsCallable(this.#functions, 'rollbackResult')(round).then(() => true);
  }

  async cancelRace(round: number): Promise<true> {
    return httpsCallable(this.#functions, 'cancelRace')(round).then(() => true);
  }
}
