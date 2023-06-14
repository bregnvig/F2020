import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DriverModule } from '@f2020/driver';
import { SharedModule } from '@f2020/shared';
import { BidComponent } from './components/bid/bid.component';
import { DriverCodesComponent } from './components/driver-codes/driver-codes.component';
import { PolePositionTimeComponent } from './components/pole-position-time/pole-position-time.component';
import { SelectDriverComponent } from './components/select-driver/select-driver.component';
import { SelectDriversComponent } from './components/select-drivers/select-drivers.component';
import { SelectTeamComponent } from './components/select-team/select-team.component';
import { SelectTeamsComponent } from './components/select-teams/select-teams.component';
import { SelectedDriverComponent } from './components/selected-driver/selected-driver.component';
import { SelectedTeamComponent } from './components/selected-team/selected-team.component';

const exported = [
  SelectDriverComponent,
  SelectTeamComponent,
  SelectTeamsComponent,
  SelectedTeamComponent,
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
        exported, components, pipes,
    ],
    exports: [exported, pipes],
})
export class ControlModule {
}
