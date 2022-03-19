import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire/compat';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { DriversEffects } from './+state/drivers.effects';
import * as fromDrivers from './+state/drivers.reducer';
import { DriverNamePipe } from './pipe/driver-name.pipe';
import { DriverPipe } from './pipe/driver.pipe';

const pipes = [
  DriverPipe,
  DriverNamePipe,
];

@NgModule({
  declarations: [pipes],
  imports: [
    CommonModule,
    StoreModule.forFeature(fromDrivers.DRIVERS_FEATURE_KEY, fromDrivers.reducer),
    EffectsModule.forFeature([DriversEffects]),
    HttpClientModule,
    AngularFireModule,
  ],
  exports: [
    pipes,
  ],
  providers: [
    DriverNamePipe,
  ]
})
export class DriverModule {
}
