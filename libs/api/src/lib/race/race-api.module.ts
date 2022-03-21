import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Bid } from '@f2020/data';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { RacesEffects } from './+state/races.effects';
import { RacesFacade } from './+state/races.facade';
import * as fromRaces from './+state/races.reducer';

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(fromRaces.RACES_FEATURE_KEY, fromRaces.reducer),
    EffectsModule.forFeature([RacesEffects]),
  ],
  providers: [RacesFacade],
})
export class RaceApiModule {
  static forRoot(initialBid: Bid) {

  }
}
