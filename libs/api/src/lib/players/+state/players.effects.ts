import { inject, Injectable } from "@angular/core";
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { converter, Player } from '@f2020/data';
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { catchError, concatMap, map, takeUntil } from 'rxjs/operators';
import { PlayersActions } from './players.actions';

export const loadPLayers = createEffect((
  actions$ = inject(Actions),
  afs = inject(Firestore),
) =>
  actions$.pipe(
    ofType(PlayersActions.loadPlayers),
    concatMap(() => collectionData(collection(afs, 'players').withConverter(converter.timestamp<Player>())).pipe(
      map(players => PlayersActions.loadPlayersSuccess({ players })),
      catchError(error => of(PlayersActions.loadPlayersFailure({ error }))),
      takeUntil(actions$.pipe(ofType(PlayersActions.loadPlayers, PlayersActions.unloadPlayers))),
    ))
  ),
  { functional: true }
);