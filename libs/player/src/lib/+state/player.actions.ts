import { createAction, props } from '@ngrx/store';
import { Player } from '@f2020/data';

export const PlayerActions = {

  loadPlayer: createAction('[Player] Load Player from player'),

  loadPlayerSuccess: createAction(
    '[Player] Load Player Success',
    props<{ player: Player }>(),
  ),

  loadPlayerUnauthorized: createAction(
    '[Player] Load Player unauthorized',
  ),

  loadPlayerFailure: createAction(
    '[Player] Load Player Failure',
    props<{ error: any }>(),
  ),

  updatePlayer: createAction(
    '[Player] Update player from sidebar',
    props<{partialPlayer: {receiveReminders?: boolean, tokens?: string[]}}>()
  ),

  updatePlayerSuccess: createAction(
    '[Player] Update Player Success',
    props<{ partialPlayer: Partial<Player> }>(),
  ),

  updatePlayerFailure: createAction(
    '[Player] Update Player failure',
    props<{ error: any }>(),
  ),

  logoutPlayer: createAction('[Sidebar Menu] Logout player from application'),

  logoutPlayerSuccess: createAction(
    '[Player] Logout player Success',
  ),

  logoutPlayerFailure: createAction(
    '[Player] Logout player Failure',
    props<{ error: any }>(),
  ),

  loadMessagingToken: createAction(
    '[Player] Load messaging token'
  ),

  loadMessingTokenFailure: createAction(
    '[Player] Load message token Failure',
    props<{ error: any; }>(),
  ),

}