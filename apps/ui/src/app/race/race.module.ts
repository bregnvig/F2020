import { DriverModule } from '@f2020/driver';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { RacesComponent } from './component/races/races.component';
import { RaceRoutingModule } from './race-routing.module';
import { MaterialModule } from '../material.module';
import * as fromRaces from './+state/races.reducer';
import { RacesEffects } from './+state/races.effects';
import { RacesFacade } from './+state/races.facade';
import { SharedModule } from '../shared/shared.module';
import { RaceComponent } from './component/race/race.component';
import { RaceStatusComponent } from './component/races/race-status/race-status.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { BidComponent } from './component/bid/bid.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { ControlModule } from '@f2020/control';
import { DriverCodesComponent } from './component/driver-codes/driver-codes.component';
import { BidsComponent } from './component/bids/bids.component';

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(fromRaces.RACES_FEATURE_KEY, fromRaces.reducer),
    EffectsModule.forFeature([RacesEffects]),
    FlexLayoutModule,
    ReactiveFormsModule,
    MaterialModule,
    RaceRoutingModule,
    SharedModule,
    GoogleMapsModule,
    ControlModule,
    DriverModule,
  ],
  providers: [RacesFacade],
  declarations: [
    RacesComponent,
    RaceComponent,
    RaceStatusComponent,
    BidComponent,
    DriverCodesComponent,
    BidsComponent,
  ],
})
export class RaceModule {
}
