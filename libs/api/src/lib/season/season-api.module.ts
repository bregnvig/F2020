import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import * as seasonEffects from './+state/season.effects';
import { SeasonFacade } from './+state/season.facade';
import * as fromSeason from './+state/season.reducer';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(fromSeason.SEASON_FEATURE_KEY, fromSeason.reducer),
    EffectsModule.forFeature(seasonEffects)
  ],
  providers: [SeasonFacade]
})
export class SeasonApiModule { }
