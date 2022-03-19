import { Injectable } from "@angular/core";
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Player } from '@f2020/data';
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { catchError, concatMap, map, takeUntil } from 'rxjs/operators';
import { PlayersActions } from './players.actions';


@Injectable()
export class PlayersEffects {
  loadPlayers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlayersActions.loadPlayers),
      concatMap(() => this.afs.collection<Player>('players').valueChanges().pipe(
        map(players => PlayersActions.loadPlayersSuccess({ players })),
        catchError(error => of(PlayersActions.loadPlayersFailure({ error }))),
        takeUntil(this.actions$.pipe(ofType(PlayersActions.loadPlayers, PlayersActions.unloadPlayers))),
      ))
    )
  );

  constructor(private actions$: Actions, private afs: AngularFirestore) {
  }
}