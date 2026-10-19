import { NgOptimizedImage } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatIconButton } from '@angular/material/button';
import { MatCard, MatCardAvatar, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { RaceResultProvider } from '@f2020/api';
import { Bid, IDriver, IRace } from '@f2020/data';
import { DateTimePipe, FlagURLPipe, icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DateTime } from 'luxon';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { LiveRaceComponent } from './live-race.component';
import { LiveStatusComponent } from './live-status.component';
import { ReliveControlsComponent } from './relive-controls';
import { injectOpenFullscreen } from './track/open-fullscreen';
import { LiveTrackPlayersComponent, LiveTrackPlayersData } from './track/live-track-players';

/** The players as the race is now. The flag opens the status of the live data */
@Component({
  selector: 'f2020-live-race-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <mat-card class="h-full">
      <mat-card-header>
        <img mat-card-avatar height="40" width="40" [ngSrc]="race() | flagURL" [alt]="race().countryCode" (click)="openStatus()">
        <mat-card-title>
          @if (relive()) {
            Relive
          } @else {
            Live live
          }
        </mat-card-title>
        <button mat-icon-button class="ms-auto" aria-label="Vis spillerne på banen" (click)="openPlayersTrack()">
          <fa-icon [icon]="icons.farExpand" />
        </button>
        <mat-card-subtitle>
          @if (latestUpdate()) {
            Sidst opdateret {{ latestUpdate() | dateTime: 'HH:mm.ss' }}
          }
          @if (error()) {
            <fa-icon class="text-red-400 mx-2" [icon]="icons.falTireFlat" />
            <span class="text-red-400">{{ error() }}</span>
          }
        </mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (relive()) {
          <f2020-relive-controls class="block" />
        }
        <f2020-live-race [race]="race()" [bids]="bids()" [drivers]="drivers()" (latestUpdate)="latestUpdate.set($event)" />
      </mat-card-content>
    </mat-card>
  `,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardAvatar,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent,
    MatIconButton,
    NgOptimizedImage,
    FlagURLPipe,
    DateTimePipe,
    FaIconComponent,
    ReliveControlsComponent,
    LiveRaceComponent,
  ],
})
export class LiveRaceCardComponent {
  #live = inject(RaceResultProvider);
  #bottomSheet = inject(MatBottomSheet);
  #openFullscreen = injectOpenFullscreen();

  race = input.required<IRace>();
  drivers = input.required<IDriver[]>();
  bids = input.required<Bid[]>();
  relive = input(false, { transform: booleanAttribute });

  protected readonly icons = icon;
  protected readonly latestUpdate = signal<DateTime | undefined>(undefined);

  protected readonly error = toSignal(combineLatest({
    result: this.#live.resultStatus,
    pitStop: this.#live.pitStopStatus,
  }).pipe(
    map(({ result, pitStop }) => result.error?.statusText || result.error?.message || pitStop.error?.statusText || pitStop.error?.message),
  ));

  #status = toSignal(combineLatest({
    resultStatus: this.#live.resultStatus,
    radioStatus: this.#live.radioStatus,
    pitStopStatus: this.#live.pitStopStatus,
    positionStatus: this.#live.positionStatus,
    intervalStatus: this.#live.intervalStatus,
    stintStatus: this.#live.stintStatus,
    raceControlStatus: this.#live.raceControlStatus,
    sectorStatus: this.#live.sectorStatus,
    locationStatus: this.#live.locationStatus,
    qualifyStatus: this.#live.qualifyStatus,
    championshipStatus: this.#live.championshipStatus,
    weatherStatus: this.#live.weatherStatus,
  }).pipe(
    map(statuses => Object.entries(statuses).map(([name, status]) => ({ name, ...status }))),
  ));

  protected openStatus() {
    this.#bottomSheet.open(LiveStatusComponent, { data: this.#status });
  }

  protected openPlayersTrack() {
    this.#openFullscreen<LiveTrackPlayersComponent, LiveTrackPlayersData>(LiveTrackPlayersComponent, {
      race: this.race(),
      drivers: this.drivers(),
      bids: this.bids(),
      relive: this.relive(),
    });
  }
}
