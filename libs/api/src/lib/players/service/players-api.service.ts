import { inject, Injectable } from '@angular/core';
import { collection, collectionData, doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { converter, Player } from '@f2020/data';
import { Observable } from 'rxjs';
import { PlayerApiService } from '../../player';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PlayersApiService {

  #functions = inject(Functions);
  readonly #players$: Observable<Player[]>;

  constructor(
    private afs: Firestore,
  ) {
    this.#players$ = collectionData(collection(this.afs, 'players').withConverter(converter.timestamp<Player>())).pipe(
      map(players => players as Player[]),
    );
  }

  getPlayers() {
    return this.#players$;
  }

  updatePlayer(uid: string, player: Partial<Player>): Promise<void> {
    return updateDoc(doc(this.afs, `${PlayerApiService.playersURL}/${uid}`), player);
  }

  deletePlayer(uid: string): Promise<true> {
    return httpsCallable(this.#functions, 'deletePlayer')(uid).then(() => true);
  }

}
