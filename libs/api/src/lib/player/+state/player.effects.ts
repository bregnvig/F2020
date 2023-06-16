import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { getMessaging, getToken } from 'firebase/messaging';
import { of } from 'rxjs';
import { catchError, concatMap, map, withLatestFrom } from 'rxjs/operators';
import { PlayerApiService } from '../service/player-api.service';
import { PlayerActions } from './player.actions';

export const loadPlayer$ = createEffect((
  actions$ = inject(Actions),
  service = inject(PlayerApiService)
) => actions$.pipe(
  ofType(PlayerActions.loadPlayer),
  concatMap(() => service.player$.pipe(
    map(player => {
      if (player?.uid) {
        return PlayerActions.loadPlayerSuccess({ player });
      }
      return PlayerActions.loadPlayerUnauthorized();
    }),
    catchError(error => of(PlayerActions.loadPlayerFailure({ error }))),
  ))),
  { functional: true }
);

export const loadToken$ = createEffect((
  actions$ = inject(Actions),
  service = inject(PlayerApiService)
) => actions$.pipe(
  ofType(PlayerActions.loadMessagingToken),
  withLatestFrom(service.player$),
  concatMap(([, player]) => getToken(getMessaging())
    .then(token => player.tokens?.some(t => t === token) ? PlayerActions.loadMessagingTokenOK() : PlayerActions.updatePlayer({ partialPlayer: { tokens: [token] } }))
    .catch(error => PlayerActions.loadMessingTokenFailure({ error })
    )
  )),
  { functional: true }
);

export const updatePlayer$ = createEffect((
  actions$ = inject(Actions),
  service = inject(PlayerApiService)
) => actions$.pipe(
  ofType(PlayerActions.updatePlayer),
  concatMap(({ partialPlayer }) => service.updatePlayer(partialPlayer).pipe(
    map(() => PlayerActions.updatePlayerSuccess({ partialPlayer })),
    catchError(error => of(PlayerActions.updatePlayerFailure({ error }))),
  ))),
  { functional: true }
);

export const logoutPlayer$ = createEffect((
  actions$ = inject(Actions),
  service = inject(PlayerApiService)
) => actions$.pipe(
  ofType(PlayerActions.logoutPlayer),
  concatMap(() => service.signOut()
    .then(() => PlayerActions.logoutPlayerSuccess())
    .catch(error => PlayerActions.logoutPlayerFailure({ error })),
  )),
  { functional: true }
);

export const joinWBC$ = createEffect((
  actions$ = inject(Actions),
  service = inject(PlayerApiService)
) => actions$.pipe(
  ofType(PlayerActions.joinWBC),
  concatMap(() => service.joinWBC()
    .then(() => PlayerActions.joinWBCSuccess())
    .catch(error => PlayerActions.joinWBCFailure({ error })),
  )),
  { functional: true }
);

export const undoWBC$ = createEffect((
  actions$ = inject(Actions),
  service = inject(PlayerApiService)
) => actions$.pipe(
  ofType(PlayerActions.undoWBC),
  concatMap(() => service.undoWBC()
    .then(() => PlayerActions.undoWBCSuccess())
    .catch(error => PlayerActions.undoWBCFailure({ error })),
  )),
  { functional: true }
);
