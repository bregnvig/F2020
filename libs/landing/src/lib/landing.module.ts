import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
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
    MatModules,
    FontAwesomeModule,
    RouterModule.forChild([
      {
        path: '',
        component: LandingComponent,
      },
    ]),
    LandingComponent,
    LastYearComponent,
    WhatElseComponent,
    JoinWbcComponent,
    WeatherComponent,
    WeatherDayComponent,
    RememberToPlayComponent,
    PreviousRaceComponent,
  ],
})
export class LandingModule {
}
