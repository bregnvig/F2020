import { ControlModule } from '@f2020/control';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { SharedModule } from '@f2020/shared';
import { FlexLayoutModule } from '@angular/flex-layout';
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { LandingComponent } from './component/landing/landing.component';
import { LastYearComponent } from './component/last-year/last-year.component';

const MatModules = [
  MatCardModule,
  MatButtonModule,
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
  declarations: [LandingComponent, LastYearComponent],
})
export class LandingModule {}
