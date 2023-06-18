import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StandingActions } from './+state/standing.actions';
import * as standingEffects from './+state/standing.effects';
import { StandingFacade } from './+state/standing.facade';
import * as fromStanding from './+state/standing.reducer';
import { StandingRoutingModule } from './standing-routing.module';

@NgModule({
  imports: [
    StoreModule.forFeature(fromStanding.STANDING_FEATURE_KEY, fromStanding.reducer),
    EffectsModule.forFeature(standingEffects),
    StandingRoutingModule,
  ],
})
export class StandingModule {

  constructor(facade: StandingFacade) {
    facade.dispatch(StandingActions.loadStandings());
  }
}
