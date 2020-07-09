import { Action, createReducer, on } from '@ngrx/store';
import { PlayerActions } from './player.actions';
import { Player } from '@f2020/data';
import * as equal from 'fast-deep-equal/es6'


export const PLAYER_FEATURE_KEY = 'player';

export interface State {
  player?: Player;
  unauthorized: boolean;
  authorized: boolean;
  loading: boolean;
  loaded: boolean;
  error?: any;
}

export interface PlayerPartialState {
  readonly [PLAYER_FEATURE_KEY]: State;
}

export const initialState: State = {
  // set initial required properties
  loaded: false,
  loading: false,
  unauthorized: false,
  authorized: false,
};

const playerReducer = createReducer(
  initialState,
  on(PlayerActions.loadPlayer, state => ({ ...state, loading: true, loaded: false, error: null })),
  on(PlayerActions.loadPlayerSuccess, (state, { player }) => 
    ({ ...state, loading: false, loaded: true, unauthorized: false, authorized: true, player })
  ),
  on(PlayerActions.updatePlayerSuccess, (state, {partialPlayer}) => {
    const newPlayer = { ...state.player, ...partialPlayer };
    if (equal(newPlayer, state.player) === false) {
      return ({...state, player: {...state.player, ...partialPlayer}});
    }
    return state;
  }),
  on(PlayerActions.joinWBC, PlayerActions.undoWBC, state => ({...state, loading: true})),
  on(PlayerActions.joinWBCSuccess, PlayerActions.undoWBCSuccess, state => ({...state, loading: false})),
  on(PlayerActions.loadPlayerUnauthorized, state => ({ ...state, unauthorized: true, authorized: false, loading: false })),
  on(PlayerActions.loadPlayerFailure, 
    PlayerActions.updatePlayerFailure, 
    PlayerActions.joinWBCFailure, 
    PlayerActions.undoWBCFailure, 
    (state, { type, error }) => {
      console.error(type, error);
      return { ...state, error: error['message'] ?? error, updating: false, loaded: false };
    })
);

export function reducer(state: State | undefined, action: Action) {
  return playerReducer(state, action);
}
