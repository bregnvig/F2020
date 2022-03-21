import { Injectable } from '@angular/core';
import { doc, docData, Firestore, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { converter, Player } from '@f2020/data';
import { FacebookAuthProvider, getAuth, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, signInWithRedirect, signOut, UserInfo } from 'firebase/auth';
import { arrayUnion } from 'firebase/firestore';
import { merge, Observable, ReplaySubject } from 'rxjs';
import { filter, first, switchMap } from 'rxjs/operators';

const playerConverter = converter.timestamp<Player>();

@Injectable({
  providedIn: 'root',
})
export class PlayerApiService {

  static readonly playersURL = 'players';

  readonly player$: Observable<Player>;
  private currentUser$ = new ReplaySubject<UserInfo | null>(1);
  private auth = getAuth();

  constructor(private afs: Firestore, private functions: Functions) {
    this.player$ = merge(
      this.currentUser$.pipe(
        filter(user => !!user?.uid),
        switchMap(user => docData(doc(this.afs, `${PlayerApiService.playersURL}/${user.uid}`).withConverter(playerConverter))),
      ),
      this.currentUser$.pipe(
        filter(user => !user || !(user?.uid))
      )
    );
    getRedirectResult(this.auth).then(result => {
      if (result && result.user) {
        this.updateBaseInformation(result.user).then(() => console.log('Base information updated'));
      }
    });
    onAuthStateChanged(this.auth, user => {
      this.currentUser$.next({ ...user });
      if (user) {
        this.updateBaseInformation(user).then(() => console.log('Base information updated'));
      }
      console.log(user);
    });
  }


  signInWithGoogle(): Promise<void> {
    return signInWithRedirect(this.auth, new GoogleAuthProvider()).then(_ => console.log('Signed in using google'));
  }

  signInWithFacebook(): Promise<void> {
    return signInWithRedirect(this.auth, new FacebookAuthProvider()).then(_ => console.log('Signed in using facebook'));
  }

  signOut(): Promise<void> {
    return signOut(this.auth);
  }

  updatePlayer(partialPlayer: Partial<Player>): Observable<Partial<Player>> {
    let payload: any = partialPlayer;
    if (partialPlayer.tokens) {
      payload = {
        ...partialPlayer,
        tokens: arrayUnion(...partialPlayer.tokens)
      };
    }
    return this.player$.pipe(
      switchMap(player => updateDoc(doc(this.afs, `${PlayerApiService.playersURL}/${player.uid}`), payload).then(() => player)),
      switchMap(player => docData(doc(this.afs, `${PlayerApiService.playersURL}/${player.uid}`))),
      first()
    );
  }

  joinWBC(): Promise<true> {
    return httpsCallable(this.functions, 'joinWBC')()
      .then(() => true);
  }

  undoWBC(): Promise<true> {
    return httpsCallable(this.functions, 'undoWBC')()
      .then(() => true);
  }

  private updateBaseInformation(player: Player): Promise<void> {
    const _player: Player = {
      uid: player.uid,
      displayName: player.displayName,
      email: player.email,
      photoURL: player.photoURL,
    };
    const docRef = doc(this.afs, `${PlayerApiService.playersURL}/${player.uid}`).withConverter(playerConverter);
    return getDoc(docRef).then(
      snapshot => snapshot.exists ? updateDoc(docRef, _player) : setDoc(docRef, _player)
    );
  }
}
