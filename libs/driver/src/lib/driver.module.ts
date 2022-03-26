import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { DriversEffects } from './+state/drivers.effects';
import * as fromDrivers from './+state/drivers.reducer';
import { AddDriverComponent } from './component';
import { DriverNamePipe } from './pipe/driver-name.pipe';
import { DriverPipe } from './pipe/driver.pipe';

const MaterialModules = [
  MatAutocompleteModule,
  MatButtonModule,
  MatDialogModule,
  MatFormFieldModule,
];

const pipes = [
  DriverPipe,
  DriverNamePipe,
];

const components = [
  AddDriverComponent,
];

@NgModule({
  declarations: [pipes, components],
  imports: [
    CommonModule,
    StoreModule.forFeature(fromDrivers.DRIVERS_FEATURE_KEY, fromDrivers.reducer),
    EffectsModule.forFeature([DriversEffects]),
    HttpClientModule,
    ReactiveFormsModule,
    MaterialModules,
  ],
  exports: [
    pipes,
    components,
  ],
  providers: [
    DriverNamePipe,
  ]
})
export class DriverModule {
}
