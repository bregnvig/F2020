import { Injectable, isDevMode } from '@angular/core';
import { doc, docData, Firestore, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { converter, Player } from '@f2020/data';
import { FacebookAuthProvider, getAuth, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, signInWithRedirect, signOut, UserInfo } from 'firebase/auth';
import { arrayUnion } from 'firebase/firestore';
import { firstValueFrom, merge, Observable, ReplaySubject } from 'rxjs';
import { filter, first, switchMap } from 'rxjs/operators';
import { FCMService } from './fcm.service';

const playerConverter = converter.timestamp<Player>();

@Injectable({
  providedIn: 'root',
})
export class PlayerApiService {

  static readonly playersURL = 'players';

  readonly player$: Observable<Player>;
  private currentUser$ = new ReplaySubject<UserInfo | null>(1);
  private auth = getAuth();

  constructor(private afs: Firestore, private functions: Functions, fcm: FCMService) {
    this.player$ = merge(
      this.currentUser$.pipe(
        filter(user => !!user?.uid),
        switchMap(user => docData(doc(this.afs, `${PlayerApiService.playersURL}/${user.uid}`).withConverter(playerConverter))),
      ),
      this.currentUser$.pipe(
        filter(user => !user || !(user?.uid)),
      ),
    );
    getRedirectResult(this.auth).then(result => {
      if (result && result.user) {
        this.updateBaseInformation(result.user).then(() => console.log('Base information updated'));
      }
    });
    onAuthStateChanged(this.auth, async user => {
      this.currentUser$.next(user ? ({ ...user }) : undefined);
      if (user) {
        await this.updateBaseInformation(user).then(() => isDevMode() && console.log('Base information updated'));
        await fcm.setupMessaging().then(
          async token => {
            const player = await firstValueFrom(this.player$);
            if (token && !player.tokens?.includes(token)) {
              await firstValueFrom(this.updatePlayer({ tokens: [token] })).then(
                () => console.log('Token added', token),
              );
            }
          },
          error => Notification.permission !== 'denied' && console.error('Unable to setup messaging', error),
        );
      }
      isDevMode() && console.log(user);
    });
  }


  signInWithGoogle(): Promise<void> {
    return signInWithRedirect(this.auth, new GoogleAuthProvider()).then(
      _ => console.log('Signed in using google'),
      error => console.error('Unable to sign in', error),
    );
  }

  signInWithFacebook(): Promise<void> {
    return signInWithRedirect(this.auth, new FacebookAuthProvider()).then(
      _ => console.log('Signed in using facebook'),
      error => console.error('Unable to sign in', error),
    );
  }

  signOut(): Promise<void> {
    return signOut(this.auth);
  }

  updatePlayer(partialPlayer: Partial<Player>): Observable<Partial<Player>> {
    let payload: any = partialPlayer;
    if (partialPlayer.tokens) {
      payload = {
        ...partialPlayer,
        tokens: arrayUnion(...partialPlayer.tokens),
      };
    }
    return this.player$.pipe(
      switchMap(player => updateDoc(doc(this.afs, `${PlayerApiService.playersURL}/${player.uid}`), payload).then(() => player)),
      switchMap(player => docData(doc(this.afs, `${PlayerApiService.playersURL}/${player.uid}`))),
      first(),
    );
  }

  async joinWBC(): Promise<true> {
    await httpsCallable(this.functions, 'joinWBC')();
    return true;
  }

  async undoWBC(): Promise<true> {
    await httpsCallable(this.functions, 'undoWBC')();
    return true;
  }

  private async updateBaseInformation(player: Player): Promise<void> {
    const _player = {
      uid: player.uid,
      displayName: player.displayName,
      email: player.email,
      photoURL: player.photoURL,
    } as Player;
    const docRef = doc(this.afs, `${PlayerApiService.playersURL}/${player.uid}`).withConverter(playerConverter);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? updateDoc(docRef, { ..._player }) : setDoc(docRef, _player);
  }
}
