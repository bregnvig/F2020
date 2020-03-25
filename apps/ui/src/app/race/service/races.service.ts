import { Bid } from './../model/bid.model';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { firestoreUtils, IRace, Player } from '@f2020/data';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RacesService {

  constructor(private afs: AngularFirestore) {

  }

  getRaces(seasonId: string): Observable<IRace[]> {
    return this.afs.collection<IRace>(`season/${seasonId}/races`).valueChanges().pipe(
      map(firestoreUtils.convertTimestamps),
    );
  }

  getBids(seasonId: string, raceId: string): Observable<Bid[]> {
    return this.afs.collection<Bid>(`season/${seasonId}/races/${raceId}/bids`).valueChanges().pipe(
      map(firestoreUtils.convertDateTimes),
    );
  }

  getBid(seasonId: string, raceId: string, uid: string): Observable<Bid> {
    return this.afs.doc<Bid>(`season/${seasonId}/races/${raceId}/bids/${uid}`).valueChanges().pipe(
      map(firestoreUtils.convertDateTimes),
    );
  }

  updateBid(seasonId: string, raceId: string, player: Player, bid: Bid): Promise<void> {
    return this.afs.doc<Bid>(`season/${seasonId}/races/${raceId}/bids/${player.uid}`).set({...bid, player: {
      uid: player.uid,
      displayName: player.displayName,
      photoURL: player.photoURL,
      email: player.email,
    }});
  }
}
