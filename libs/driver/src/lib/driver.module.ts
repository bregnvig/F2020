import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
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
