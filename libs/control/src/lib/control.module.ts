import { SharedModule } from '@f2020/shared';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLegacyOptionModule as MatOptionModule } from '@angular/material/legacy-core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { DriverModule } from '@f2020/driver';
import { BidComponent } from './components/bid/bid.component';
import { DriverCodesComponent } from './components/driver-codes/driver-codes.component';
import { PolePositionTimeComponent } from './components/pole-position-time/pole-position-time.component';
import { SelectDriverComponent } from './components/select-driver/select-driver.component';
import { SelectDriversComponent } from './components/select-drivers/select-drivers.component';
import { SelectedDriverComponent } from './components/selected-driver/selected-driver.component';
import { SelectedTeamComponent } from './components/selected-team/selected-team.component';

const exported = [
  SelectDriverComponent,
  SelectDriversComponent,
  SelectedDriverComponent,
  PolePositionTimeComponent,
  BidComponent,
  DriverCodesComponent,
];

const components = [
  
];

const pipes = [
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatOptionModule,
    MatExpansionModule,
    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
    SharedModule,
    DriverModule,
    FlexModule,
  ],
  declarations: [exported, components, pipes, SelectedTeamComponent],
  exports: [exported, pipes],
})
export class ControlModule {
}
