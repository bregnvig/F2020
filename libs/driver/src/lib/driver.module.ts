import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import * as driversEffects from './+state/drivers.effects';
import * as fromDrivers from './+state/drivers.reducer';

@NgModule({
  imports: [
    StoreModule.forFeature(fromDrivers.DRIVERS_FEATURE_KEY, fromDrivers.reducer),
    EffectsModule.forFeature(driversEffects),
    HttpClientModule,
    ReactiveFormsModule,
  ],
})
export class DriverModule {
}
