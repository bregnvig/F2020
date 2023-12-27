import { Injectable } from '@angular/core';
import { collection, collectionData, doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { converter, Player } from '@f2020/data';
import { Observable } from 'rxjs';
import { PlayerApiService } from '../../player';

@Injectable({
  providedIn: 'root',
})
export class PlayersApiService {

  readonly #players$: Observable<Player[]>;

  constructor(
    private afs: Firestore) {
    this.#players$ = collectionData(collection(this.afs, 'players').withConverter(converter.timestamp<Player>()));
  }

  getPlayers() {
    return this.#players$;
  }

  updatePlayer(uid: string, player: Partial<Player>): Promise<void> {
    return updateDoc(doc(this.afs, `${PlayerApiService.playersURL}/${uid}`), player);
  }

}
