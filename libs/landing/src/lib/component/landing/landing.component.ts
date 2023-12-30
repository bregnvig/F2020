import { PlayerStore } from '@f2020/api';
import { Player } from '@f2020/data';
import { Component, Signal } from '@angular/core';
import { WeatherComponent } from '../card/weather/weather.component';
import { LastYearComponent } from '../card/last-year/last-year.component';
import { JoinWbcComponent } from '../card/join-wbc/join-wbc.component';
import { PreviousRaceComponent } from '../card/previous-race/previous-race.component';
import { RememberToPlayComponent } from '../card/remember-to-play/remember-to-play.component';
import { WhatElseComponent } from '../card/what-else/what-else.component';
import { CardPageComponent, LoadingComponent } from '@f2020/shared';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'f2020-landing',
  templateUrl: './landing.component.html',
  standalone: true,
  imports: [NgIf, CardPageComponent, WhatElseComponent, RememberToPlayComponent, PreviousRaceComponent, JoinWbcComponent, LastYearComponent, WeatherComponent, LoadingComponent, AsyncPipe],
})
export class LandingComponent {

  player: Signal<Player>;

  constructor(store: PlayerStore) {
    this.player = store.player;
  }

}
