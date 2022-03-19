import { Inject, Injectable } from "@angular/core";
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Player } from '@f2020/data';
import { GoogleFunctions } from '@f2020/firebase';
import firebase from 'firebase/compat/app';
import { PlayerApiService } from '../../player';

@Injectable({
  providedIn: 'root'
})
export class PlayersApiService {
  constructor(
    private afs: AngularFirestore,
    @Inject(GoogleFunctions) private functions: firebase.functions.Functions) {
  }

  updatePlayer(uid: string, player: Partial<Player>): Promise<void> {
    return this.afs.doc(`${PlayerApiService.playersURL}/${uid}`).update(player);
  }

  updateBalance(uid: string, balance: number): Promise<boolean> {
    return this.functions.httpsCallable('manualBalance')({ uid, balance }).then(() => true);
  }
  migrateAccount(uid: string, playerName: string): Promise<boolean> {
    return this.functions.httpsCallable('migrateAccount')({ uid, playerName }).then(() => true);
  }
}