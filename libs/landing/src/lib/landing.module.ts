import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ControlModule } from '@f2020/control';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { SharedModule } from '@f2020/shared';
import { FlexLayoutModule } from '@angular/flex-layout';
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { LandingComponent } from './component/landing/landing.component';
import { LastYearComponent } from './component/card/last-year/last-year.component';
import { WhatElseComponent } from './component/card/what-else/what-else.component';
import { JoinWbcComponent } from './component/card/join-wbc/join-wbc.component';

const MatModules = [
  MatCardModule,
  MatButtonModule,
  MatSnackBarModule,
]

@NgModule({
  imports: [
    CommonModule,
    FlexLayoutModule,
    SharedModule,
    MatModules,
    ControlModule,
    RouterModule.forChild([
      {
        path: '',
        component: LandingComponent
      }
    ]),
  ],
  declarations: [LandingComponent, LastYearComponent, WhatElseComponent, JoinWbcComponent],
})
export class LandingModule {}
