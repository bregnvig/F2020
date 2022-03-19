import { Inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Bid, firestoreUtils, IQualifyResult, IRace, IRaceResult, mapper, Player, RoundResult } from '@f2020/data';
import { GoogleFunctions } from '@f2020/firebase';
import firebase from 'firebase/compat/app';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ErgastService } from '../../service/ergast.service';
import { SeasonService } from './../../season/service/season.service';

@Injectable({
  providedIn: 'root',
})
export class RacesService {

  constructor(
    private afs: AngularFirestore,
    private ergastService: ErgastService,
    @Inject(GoogleFunctions) private functions: firebase.functions.Functions) {

  }

  getRaces(seasonId: string): Observable<IRace[]> {
    return this.afs.collection<IRace>(`${SeasonService.seasonsURL}/${seasonId}/races`).valueChanges().pipe(
      map(races => firestoreUtils.convertTimestamps(races)),
    );
  }

  getBids(seasonId: string, race: IRace, uid: string): Observable<Bid[]> {
    return this.afs.collection<Bid>(`${SeasonService.seasonsURL}/${seasonId}/races/${race.round}/bids`).valueChanges().pipe(
      map(firestoreUtils.convertDateTimes),
      map((bids: Bid[]) => bids.some(b => b.player.uid === uid && b.submitted || race.state !== 'open') ? bids : [])
    );
  }

  getBid(seasonId: string, round: number, uid: string): Observable<Bid> {
    return this.afs.doc<Bid>(`${SeasonService.seasonsURL}/${seasonId}/races/${round}/bids/${uid}`).valueChanges().pipe(
      map(firestoreUtils.convertDateTimes),
    );
  }

  updateRace(seasonId: string, round: number, race: Partial<IRace>): Promise<void> {
    return this.afs.doc<IRace>(`${SeasonService.seasonsURL}/${seasonId}/races/${round}`).update(race);
  }

  updateBid(seasonId: string, round: number, player: Player, bid: Bid): Promise<void> {
    return this.afs.doc<Bid>(`${SeasonService.seasonsURL}/${seasonId}/races/${round}/bids/${player.uid}`).set({
      ...bid, player: {
        uid: player.uid,
        displayName: player.displayName,
        photoURL: player.photoURL,
        email: player.email,
      }
    });
  }

  getResult(seasonId: string | number, round: number): Observable<IRaceResult | null> {
    return this.ergastService.get<IRaceResult>(`${seasonId}/${round}/results.json`, ergastData => {
      const race = ergastData.MRData.RaceTable.Races[0];
      return race ? mapper.raceResult(race) : null;
    });
  }

  getQualify(seasonId: string | number, round: number): Observable<IQualifyResult> {
    return this.ergastService.get<IQualifyResult>(`${seasonId}/${round}/qualifying.json`, ergastData => {
      const race = ergastData.MRData.RaceTable.Races[0];
      return mapper.qualifyResult(race);
    });
  }

  getLastYearResult(seasonId: number, countryCode: string): Observable<RoundResult> {
    return this.afs.doc<RoundResult>(`${SeasonService.seasonsURL}/${seasonId}/lastYear/${countryCode}`).get().pipe(
      map(snapshot => snapshot.data() as RoundResult)
    );
  }

  async submitBid(bid: Bid, player: Player): Promise<true> {
    return this.functions.httpsCallable('submitBid')({
      ...bid, player: {
        uid: player.uid,
        displayName: player.displayName,
        photoURL: player.photoURL,
        tokens: player.tokens,
        email: player.email,
      },
      version: 2
    }).then(() => true);
  }

  async submitResult(result: Bid): Promise<true> {
    return this.functions.httpsCallable('submitResult')(result).then(() => true);
  }

  async submitInterimResult(result: Partial<Bid>): Promise<true> {
    return this.functions.httpsCallable('submitInterimResult')(result).then(() => true);
  }

}
