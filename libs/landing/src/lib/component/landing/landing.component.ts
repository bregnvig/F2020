import { PlayerStore } from '@f2020/api';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { WeatherComponent } from '../card/weather/weather.component';
import { LastYearComponent } from '../card/last-year/last-year.component';
import { JoinWbcComponent } from '../card/join-wbc/join-wbc.component';
import { PreviousRaceComponent } from '../card/previous-race/previous-race.component';
import { RememberToPlayComponent } from '../card/remember-to-play/remember-to-play.component';
import { WhatElseComponent } from '../card/what-else/what-else.component';
import { CardPageComponent, LoadingComponent } from '@f2020/shared';
import { hiddenLandingCards, LandingCard } from '@f2020/data';
import { DriverChampionshipComponent } from '../card/championship/driver-championship';
import { TeamChampionshipComponent } from '../card/championship/team-championship';
import { WbcChampionshipComponent } from '../card/championship/wbc-championship';

@Component({
  selector: 'f2020-landing',
  templateUrl: './landing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardPageComponent, WhatElseComponent, RememberToPlayComponent, PreviousRaceComponent, DriverChampionshipComponent, TeamChampionshipComponent, WbcChampionshipComponent, JoinWbcComponent, LastYearComponent, WeatherComponent, LoadingComponent],
})
export class LandingComponent {

  player = inject(PlayerStore).player;

  #hidden = computed(() => hiddenLandingCards(this.player()));

  protected shown(card: LandingCard) {
    return !this.#hidden().includes(card);
  }

}
