import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import * as racesEffects from './+state/races.effects';
import * as fromRaces from './+state/races.reducer';

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(fromRaces.RACES_FEATURE_KEY, fromRaces.reducer),
    EffectsModule.forFeature(racesEffects),
  ],
})
export class RaceApiModule {
}
