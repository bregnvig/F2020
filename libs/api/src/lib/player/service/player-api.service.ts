import { Inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Player } from '@f2020/data';
import { GoogleFunctions } from '@f2020/firebase';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import { merge, Observable, ReplaySubject } from 'rxjs';
import { filter, first, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PlayerApiService {

  static readonly playersURL = 'players';

  readonly player$: Observable<Player>;
  private currentUser$ = new ReplaySubject<firebase.UserInfo | null>(1);

  constructor(private afs: AngularFirestore, @Inject(GoogleFunctions) private functions: firebase.functions.Functions) {
    this.player$ = merge(
      this.currentUser$.pipe(
        filter(user => !!user?.uid),
        switchMap(user => this.afs.doc<Player>(`${PlayerApiService.playersURL}/${user.uid}`).valueChanges()),
      ),
      this.currentUser$.pipe(
        filter(user => !user || !(user?.uid))
      )
    );
    firebase.auth().getRedirectResult().then(result => {
      if (result && result.user) {
        this.updateBaseInformation(result.user).toPromise().then(() => console.log('Base information updated'));
      }
    });
    firebase.auth().onAuthStateChanged(user => {
      this.currentUser$.next({ ...user });
      if (user) {
        this.updateBaseInformation(user).toPromise().then(() => console.log('Base information updated'));
      }
      console.log(user);
    });
  }


  signInWithGoogle(): Promise<void> {
    return firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider()).then(_ => console.log('Signed in using google'));
  }

  signInWithFacebook(): Promise<void> {
    return firebase.auth().signInWithRedirect(new firebase.auth.FacebookAuthProvider()).then(_ => console.log('Signed in using facebook'));
  }

  signOut(): Promise<void> {
    return firebase.auth().signOut();
  }

  updatePlayer(partialPlayer: Partial<Player>): Observable<Partial<Player>> {
    let payload: any = partialPlayer;
    if (partialPlayer.tokens) {
      payload = {
        ...partialPlayer,
        tokens: firebase.firestore.FieldValue.arrayUnion(...partialPlayer.tokens)
      };
    }
    return this.player$.pipe(
      switchMap(player => this.afs.doc(`${PlayerApiService.playersURL}/${player.uid}`).update(payload).then(() => player)),
      switchMap(player => this.afs.doc(`${PlayerApiService.playersURL}/${player.uid}`).valueChanges()),
      first()
    );
  }

  joinWBC(): Promise<true> {
    return this.functions.httpsCallable('joinWBC')()
      .then(() => true);
  }

  undoWBC(): Promise<true> {
    return this.functions.httpsCallable('undoWBC')()
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
