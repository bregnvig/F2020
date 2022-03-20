import { Inject, Injectable } from "@angular/core";
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { Player } from '@f2020/data';
import { GoogleFunctions } from '@f2020/firebase';
import { Functions, httpsCallable } from 'firebase/functions';
import { PlayerApiService } from '../../player';

@Injectable({
  providedIn: 'root'
})
export class PlayersApiService {
  constructor(
    private afs: Firestore,
    @Inject(GoogleFunctions) private functions: Functions) {
  }

  updatePlayer(uid: string, player: Partial<Player>): Promise<void> {
    return updateDoc(doc(this.afs, `${PlayerApiService.playersURL}/${uid}`), player);
  }

  updateBalance(uid: string, balance: number): Promise<boolean> {
    return httpsCallable(this.functions, 'manualBalance')({ uid, balance }).then(() => true);
  }
  migrateAccount(uid: string, playerName: string): Promise<boolean> {
    return httpsCallable(this.functions, 'migrateAccount')({ uid, playerName }).then(() => true);
  }
}