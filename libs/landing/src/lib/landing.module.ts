import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { RouterModule } from "@angular/router";
import { RaceApiModule } from '@f2020/api';
import { ControlModule } from '@f2020/control';
import { SharedModule } from '@f2020/shared';
import { InterimResultComponent } from './component/card/interim-result/interim-result.component';
import { JoinWbcComponent } from './component/card/join-wbc/join-wbc.component';
import { LastYearComponent } from './component/card/last-year/last-year.component';
import { PreviousRaceComponent } from './component/card/previous-race/previous-race.component';
import { RememberToPlayComponent } from './component/card/remember-to-play/remember-to-play.component';
import { WeatherDayComponent } from './component/card/weather/weather-day/weather-day.component';
import { WeatherComponent } from './component/card/weather/weather.component';
import { WhatElseComponent } from './component/card/what-else/what-else.component';
import { LandingComponent } from './component/landing/landing.component';

const MatModules = [
  MatCardModule,
  MatButtonModule,
  MatSnackBarModule,
];

@NgModule({
  imports: [
    CommonModule,
    FlexLayoutModule,
    SharedModule,
    MatModules,
    ControlModule,
    RaceApiModule,
    RouterModule.forChild([
      {
        path: '',
        component: LandingComponent
      }
    ]),
  ],
  declarations: [LandingComponent, LastYearComponent, WhatElseComponent, JoinWbcComponent, WeatherComponent, WeatherDayComponent, RememberToPlayComponent, InterimResultComponent, PreviousRaceComponent],
})
export class LandingModule { }
