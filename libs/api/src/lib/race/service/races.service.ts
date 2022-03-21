import { Inject, Injectable } from '@angular/core';
import { collectionData, doc, docData, Firestore, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Bid, converter, IQualifyResult, IRace, IRaceResult, mapper, Player, RoundResult } from '@f2020/data';
import { collection } from 'firebase/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ErgastService } from '../../service/ergast.service';
import { SeasonService } from './../../season/service/season.service';

const bidConverter = converter.timestamp<Bid>();

@Injectable({
  providedIn: 'root',
})
export class RacesService {

  constructor(
    private afs: Firestore,
    private ergastService: ErgastService,
    private functions: Functions) {

  }

  getRaces(seasonId: string): Observable<IRace[]> {
    return collectionData(collection(this.afs, `${SeasonService.seasonsURL}/${seasonId}/races`).withConverter(converter.timestamp<IRace>()));
  }

  getBids(seasonId: string, race: IRace, uid: string): Observable<Bid[]> {
    return collectionData(collection(this.afs, `${SeasonService.seasonsURL}/${seasonId}/races/${race.round}/bids`).withConverter(bidConverter)).pipe(
      map((bids: Bid[]) => bids.some(b => b.player.uid === uid && b.submitted || race.state !== 'open') ? bids : [])
    );
  }

  getBid(seasonId: string, round: number, uid: string): Observable<Bid> {
    return docData(doc(this.afs, `${SeasonService.seasonsURL}/${seasonId}/races/${round}/bids/${uid}`).withConverter(bidConverter));
  }

  updateRace(seasonId: string, round: number, race: Partial<IRace>): Promise<void> {
    return updateDoc(doc(this.afs, `${SeasonService.seasonsURL}/${seasonId}/races/${round}`), race);
  }

  updateBid(seasonId: string, round: number, player: Player, bid: Bid): Promise<void> {
    return setDoc(doc(this.afs, `${SeasonService.seasonsURL}/${seasonId}/races/${round}/bids/${player.uid}`), {
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

  getLastYearResult(seasonId: number, countryCode: string): Promise<RoundResult> {
    return getDoc(doc(this.afs, `${SeasonService.seasonsURL}/${seasonId}/lastYear/${countryCode}`)).then(
      snapshot => snapshot.data() as RoundResult
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
      version: 2
    }).then(() => true);
  }

  async submitResult(result: Bid): Promise<true> {
    return httpsCallable(this.functions, 'submitResult')(result).then(() => true);
  }

  async submitInterimResult(result: Partial<Bid>): Promise<true> {
    return httpsCallable(this.functions, 'submitInterimResult')(result).then(() => true);
  }

}
