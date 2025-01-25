import { PlayerStore } from '@f2020/api';
import { Component, inject } from '@angular/core';
import { WeatherComponent } from '../card/weather/weather.component';
import { LastYearComponent } from '../card/last-year/last-year.component';
import { JoinWbcComponent } from '../card/join-wbc/join-wbc.component';
import { PreviousRaceComponent } from '../card/previous-race/previous-race.component';
import { RememberToPlayComponent } from '../card/remember-to-play/remember-to-play.component';
import { WhatElseComponent } from '../card/what-else/what-else.component';
import { CardPageComponent, LoadingComponent } from '@f2020/shared';

@Component({
  selector: 'f2020-landing',
  templateUrl: './landing.component.html',
  imports: [CardPageComponent, WhatElseComponent, RememberToPlayComponent, PreviousRaceComponent, JoinWbcComponent, LastYearComponent, WeatherComponent, LoadingComponent],
})
export class LandingComponent {

  player = inject(PlayerStore).player;

}
