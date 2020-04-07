import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Player } from '@f2020/data';
import * as firebase from 'firebase/app';
import { Observable, ReplaySubject } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {

  static readonly playersURL = 'players';
  
  readonly player$: Observable<Player>;
  private currentUser$ = new ReplaySubject<firebase.UserInfo | null>(1);

  constructor(private afs: AngularFirestore) {
    this.player$ = this.currentUser$.pipe(
      switchMap(user => this.afs.doc<Player>(`${PlayerService.playersURL}/${user.uid}`).valueChanges())
    )
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
