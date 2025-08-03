import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardAvatar, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { LiveResultService, OpenF1WSSService, RaceStore } from '@f2020/api';
import { Bid, IDriver } from '@f2020/data';
import { CardPageComponent, DateTimePipe, FlagURLPipe, icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DateTime } from 'luxon';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { LiveRaceComponent } from './live-race.component';
import { LiveRadioComponent } from './live-radio.component';
import { LivePositionsComponent } from './positions/live-positions.component';

@Component({
  selector: 'f2020-live-live',
  template: `
    <sha-card-page cols="lg:grid-cols-2">
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
            <mat-card-subtitle>
              @if (latestUpdate()) {
                Sidst opdateret {{ latestUpdate() | dateTime: 'HH:mm.ss' }}
              }
              @if (error()) {
                <fa-icon class="text-red-400 mx-2" [icon]="icons.falTireFlat"/>
                <span class="text-red-400">{{ error() }}</span>
              }
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <f2020-live-race [race]="race()" [bids]="bids()" [drivers]="drivers()" (latestUpdate)="latestUpdate.set($event)"/>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header>
            <mat-card-title>Løbspositioner</mat-card-title>
            <mat-card-subtitle>
              Sidst opdateret {{ positions.latestUpdate() | dateTime: 'HH:mm.ss' }}
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <f2020-live-postions #positions class="block mt-3" [race]="race()" [drivers]="drivers()"/>
          </mat-card-content>
        </mat-card>
        <mat-card class="col-span-2">
          <mat-card-header>
            <mat-card-title>Holdbeskeder</mat-card-title>
            <mat-card-subtitle>
              @if (radioError()) {
                <fa-icon class="text-red-400 me-2" [icon]="icons.falTireFlat"/>
                <span class="text-red-400">{{ radioError() }}</span>
              }
            </mat-card-subtitle>
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
    CardPageComponent,
    FlagURLPipe,
    MatCardAvatar,
    MatCardSubtitle,
    NgOptimizedImage,
    DateTimePipe,
    FaIconComponent,
    LiveRaceComponent,
    LivePositionsComponent,
    LiveRadioComponent,
  ],
  providers: [
    LiveResultService,
    OpenF1WSSService,
  ],
})

export class LiveLiveComponent {

  icons = icon;
  #store = inject(RaceStore);
  #live = inject(LiveResultService);
  radioError = toSignal(this.#live.radioStatus.pipe(
    map(status => status.error?.statusText),
  ));

  error = toSignal(combineLatest({
    result: this.#live.resultStatus,
    pitStop: this.#live.pitStopStatus,
  }).pipe(
    map(({ result, pitStop }) => result.error?.statusText || pitStop.error?.statusText),
  ));

  race = this.#store.race;
  drivers: Signal<IDriver[] | undefined> = this.#store.drivers;
  bids: Signal<Bid[]> = this.#store.bids as Signal<Bid[]>;
  isLiveLive = computed(() => this.race().raceStart.minus({ hour: 1 }) < DateTime.local() && this.race().raceStart.plus({ hour: 3 }) > DateTime.local());
  latestUpdate = signal<DateTime | undefined>(undefined);
}
