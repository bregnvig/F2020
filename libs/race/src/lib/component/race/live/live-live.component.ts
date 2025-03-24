import { Component, computed, inject, Signal } from '@angular/core';
import { MatCard, MatCardAvatar, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { LiveRadioComponent } from './live-radio.component';
import { Bid, IDriver } from '@f2020/data';
import { LiveRaceComponent } from './live-race.component';
import { RaceStore } from '@f2020/api';
import { CardPageComponent, FlagURLPipe } from '@f2020/shared';
import { DateTime } from 'luxon';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'f2020-live-live',
  template: `
    <sha-card-page>
      @if (race()) {
        <mat-card>
          <mat-card-header>
            <img mat-card-avatar height="40" width="40" [ngSrc]="race() | flagURL" [alt]="race().countryCode">
            <mat-card-title>
              @if (isLiveLive()) {
                Live live
              } @else {
                Relive
              }
            </mat-card-title>
            <mat-card-subtitle>{{ race().name }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <f2020-live-race [race]="race()" [bids]="bids()" [drivers]="drivers()"/>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header>
            <mat-card-title>Holdbeskeder</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <f2020-live-radio class="block mt-3" [race]="race()" [drivers]="drivers()"/>
          </mat-card-content>
        </mat-card>
      }
    </sha-card-page>

  `,
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    LiveRadioComponent,
    LiveRaceComponent,
    CardPageComponent,
    FlagURLPipe,
    MatCardAvatar,
    MatCardSubtitle,
    NgOptimizedImage,
  ],
})

export class LiveLiveComponent {

  #store = inject(RaceStore);


  race = this.#store.race;
  drivers: Signal<IDriver[] | undefined> = this.#store.drivers;
  bids: Signal<Bid[]> = this.#store.bids as Signal<Bid[]>;
  isLiveLive = computed(() => this.race().raceStart.minus({ hour: 1 }) < DateTime.local() && this.race().raceStart.plus({ hour: 3 }) > DateTime.local());

}
