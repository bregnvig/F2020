import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import * as driversEffects from './+state/drivers.effects';
import * as fromDrivers from './+state/drivers.reducer';
import { AddDriverComponent } from './component';
import { DriverNamePipe } from './pipe/driver-name.pipe';
import { DriverPipe } from './pipe/driver.pipe';

const MaterialModules = [
  MatAutocompleteModule,
  MatButtonModule,
  MatDialogModule,
  MatFormFieldModule,
  MatInputModule,
];

const pipes = [
  DriverPipe,
  DriverNamePipe,
];

const components = [
  AddDriverComponent,
];

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(fromDrivers.DRIVERS_FEATURE_KEY, fromDrivers.reducer),
    EffectsModule.forFeature(driversEffects),
    HttpClientModule,
    ReactiveFormsModule,
    MaterialModules,
    pipes, components,
  ],
  exports: [
    pipes,
    components,
  ],
})
export class DriverModule {
}
