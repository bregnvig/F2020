import { PlayerFacade } from '@f2020/api';
import { Player } from '@f2020/data';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { LoadingComponent } from '../../../../../shared/src/lib/component/loading/loading.component';
import { WeatherComponent } from '../card/weather/weather.component';
import { LastYearComponent } from '../card/last-year/last-year.component';
import { JoinWbcComponent } from '../card/join-wbc/join-wbc.component';
import { PreviousRaceComponent } from '../card/previous-race/previous-race.component';
import { RememberToPlayComponent } from '../card/remember-to-play/remember-to-play.component';
import { WhatElseComponent } from '../card/what-else/what-else.component';
import { CardPageComponent } from '../../../../../shared/src/lib/component/card-page/card-page.component';
import { NgIf, AsyncPipe } from '@angular/common';

@Component({
    selector: 'f2020-landing',
    templateUrl: './landing.component.html',
    styleUrls: ['./landing.component.scss'],
    standalone: true,
    imports: [NgIf, CardPageComponent, WhatElseComponent, RememberToPlayComponent, PreviousRaceComponent, JoinWbcComponent, LastYearComponent, WeatherComponent, LoadingComponent, AsyncPipe]
})
export class LandingComponent implements OnInit {

  player$: Observable<Player>;

  constructor(private facade: PlayerFacade) {
  }

  ngOnInit(): void {
    this.player$ = this.facade.player$;
  }

}
