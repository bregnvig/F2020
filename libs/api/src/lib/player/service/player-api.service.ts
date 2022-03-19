import { Inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Player } from '@f2020/data';
import { GoogleFunctions } from '@f2020/firebase';
import { FacebookAuthProvider, getAuth, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, signInWithRedirect, signOut, UserInfo } from 'firebase/auth';
import { arrayUnion } from 'firebase/firestore';
import { Functions, httpsCallable } from 'firebase/functions';
import { firstValueFrom, lastValueFrom, merge, Observable, ReplaySubject } from 'rxjs';
import { filter, first, switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PlayerApiService {

  static readonly playersURL = 'players';

  readonly player$: Observable<Player>;
  private currentUser$ = new ReplaySubject<UserInfo | null>(1);
  private auth = getAuth();

  constructor(private afs: AngularFirestore, @Inject(GoogleFunctions) private functions: Functions) {
    this.player$ = merge(
      this.currentUser$.pipe(
        filter(user => !!user?.uid),
        switchMap(user => this.afs.doc<Player>(`${PlayerApiService.playersURL}/${user.uid}`).valueChanges()),
        tap(_ => console.log('PLAYER FROM DOC', _)),
      ),
      this.currentUser$.pipe(
        filter(user => !user || !(user?.uid))
      )
    );
    getRedirectResult(this.auth).then(result => {
      if (result && result.user) {
        lastValueFrom(this.updateBaseInformation(result.user)).then(() => console.log('Base information updated'));
      }
    });
    onAuthStateChanged(this.auth, user => {
      this.currentUser$.next({ ...user });
      if (user) {
        firstValueFrom(this.updateBaseInformation(user)).then(() => console.log('Base information updated'));
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
      switchMap(player => this.afs.doc(`${PlayerApiService.playersURL}/${player.uid}`).update(payload).then(() => player)),
      switchMap(player => this.afs.doc(`${PlayerApiService.playersURL}/${player.uid}`).valueChanges()),
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

  private updateBaseInformation(player: Player): Observable<void> {
    const _player: Player = {
      uid: player.uid,
      displayName: player.displayName,
      email: player.email,
      photoURL: player.photoURL,
    };
    const doc = this.afs.doc(`${PlayerApiService.playersURL}/${player.uid}`);
    return doc.get().pipe(
      switchMap(snapshot => snapshot.exists ? doc.update(_player) : doc.set(_player)),
      first(),
    );
  }
}
