import { ISeason } from '@f2020/data';
import { createAction, props } from '@ngrx/store';

export const SeasonActions = {
  loadSeason: createAction(
    '[Season] Load Season',
    props<{ seasonId: string; }>(),
  ),

  loadSeasonSuccess: createAction(
    '[Season] Load Season Success',
    props<{ season: ISeason; }>(),
  ),

  loadSeasonFailure: createAction(
    '[Season] Load Season Failure',
    props<{ error: any; }>(),
  ),
};
