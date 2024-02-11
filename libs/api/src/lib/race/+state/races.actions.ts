import { Bid } from '@f2020/data';
import { createAction, props } from '@ngrx/store';

export const RacesActions = {

  loadInterimResult: createAction(
    '[Interim page] Load intermim result',
  ),

  loadInterimResultSuccess: createAction(
    '[Interim API] Load intermim result Success',
    props<{ result: Partial<Bid>; }>(),
  ),

  loadInterimResultFailure: createAction(
    '[Interim API] Load intermim result Failure',
    props<{ error: any; }>(),
  ),
  submitInterimResult: createAction(
    '[Interim page] submit interim result',
  ),

  submitInterimResultSuccess: createAction(
    '[Interim API] Submit interim result Success',
  ),

  submitInterimResultFailure: createAction(
    '[Interim API] Submit interim result Failure',
    props<{ error: any; }>(),
  ),
};
