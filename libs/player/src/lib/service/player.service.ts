import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Player } from '@f2020/data';
import { merge, Observable, ReplaySubject } from 'rxjs';
import { filter, first, mapTo, switchMap } from 'rxjs/operators';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {

  static readonly playersURL = 'players';

  readonly player$: Observable<Player>;
  private currentUser$ = new ReplaySubject<firebase.UserInfo | null>(1);

  constructor(private afs: AngularFirestore) {
    this.player$ = merge(
      this.currentUser$.pipe(
        filter(user => !!user?.uid),
        switchMap(user => this.afs.doc<Player>(`${PlayerService.playersURL}/${user.uid}`).valueChanges()),
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
      }
    }
    return this.player$.pipe(
      switchMap(player => this.afs.doc(`${PlayerService.playersURL}/${player.uid}`).update(payload)),
      mapTo(partialPlayer),
      first()
    )
  }

  private updateBaseInformation(player: Player): Observable<void> {
    const _player: Player = {
      uid: player.uid,
      displayName: player.displayName,
      email: player.email,
      photoURL: player.photoURL,
    };
    const doc = this.afs.doc(`${PlayerService.playersURL}/${player.uid}`);
    return doc.get().pipe(
      switchMap(snapshot => snapshot.exists ? doc.update(_player) : doc.set(_player)),
      first(),
    );
  }
}
