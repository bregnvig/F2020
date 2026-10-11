import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, Injector, signal, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardAvatar, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { OpenF1WSSService, provideRaceResultService, RaceResultProvider, RaceStore } from '@f2020/api';
import { Bid, IDriver } from '@f2020/data';
import { CardPageComponent, DateTimePipe, FlagURLPipe, icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DateTime } from 'luxon';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { LiveRaceComponent } from './live-race.component';
import { LiveRadioComponent } from './live-radio.component';
import { LivePositionsComponent } from './positions/live-positions.component';
import { RaceControlService } from './race-control';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { LiveStatusComponent } from './live-status.component';
import { LiveTrackDriversComponent } from './track/live-track-drivers';
import { ReliveControlsComponent } from './relive-controls';
import { TrackLapComponent } from './track/track-lap';
import { LiveTrackPlayersComponent, LiveTrackPlayersData } from './track/live-track-players';
import { LiveTrackDriversData, LiveTrackDriversDialogComponent } from './track/live-track-drivers-dialog';
import { ComponentType } from '@angular/cdk/portal';
import { MatDialog } from '@angular/material/dialog';
import { MatIconButton } from '@angular/material/button';

@Component({
  selector: 'f2020-live-live',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sha-card-page cols="lg:grid-cols-2">
      @if (race()) {
        <mat-card>
          <mat-card-header>
            <img mat-card-avatar height="40" width="40" [ngSrc]="race() | flagURL" [alt]="race().countryCode" (click)="openStatus()">
            <mat-card-title>
              @if (isLiveLive()) {
                Live live
              } @else {
                Relive
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
            @if (!isLiveLive()) {
              <f2020-relive-controls class="block" />
            }
            <f2020-live-race [race]="race()" [bids]="bids()" [drivers]="drivers()" (latestUpdate)="latestUpdate.set($event)" />
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
            <f2020-live-positions #positions class="block mt-3" [race]="race()" [drivers]="drivers()" />
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header>
            <mat-card-title><f2020-track-lap [race]="race()" emptyText="Banen" /></mat-card-title>
            <button mat-icon-button class="ms-auto" aria-label="Vis banen i fuld skærm" (click)="openDriversTrack()">
              <fa-icon [icon]="icons.farExpand" />
            </button>
          </mat-card-header>
          <mat-card-content>
            <f2020-live-track-drivers class="block mt-3 aspect-square max-h-[70vh] mx-auto" [race]="race()" [drivers]="drivers()" [showLap]="false" />
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header>
            <mat-card-title>Holdbeskeder</mat-card-title>
            <mat-card-subtitle>
              @if (radioError()) {
                <fa-icon class="text-red-400 me-2" [icon]="icons.falTireFlat" />
                <span class="text-red-400">{{ radioError() }}</span>
              }
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <f2020-live-radio class="block mt-3" [race]="race()" [drivers]="drivers()" />
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
    LiveTrackDriversComponent,
    MatIconButton,
    ReliveControlsComponent,
    TrackLapComponent,
  ],
  providers: [
    provideRaceResultService(),
    RaceControlService,
    OpenF1WSSService,
  ],
})

export class LiveLiveComponent {

  icons = icon;
  #store = inject(RaceStore);
  #live = inject(RaceResultProvider);
  #bottomSheet = inject(MatBottomSheet);
  #dialog = inject(MatDialog);
  #injector = inject(Injector);
  radioError = toSignal(this.#live.radioStatus.pipe(
    map(status => status.error?.statusText ?? status.error?.message),
  ));

  error = toSignal(combineLatest({
    result: this.#live.resultStatus,
    pitStop: this.#live.pitStopStatus,
  }).pipe(
    map(({ result, pitStop }) => result.error?.statusText || result.error?.message || pitStop.error?.statusText || pitStop.error?.message),
  ));

  race = this.#store.race;
  drivers: Signal<IDriver[] | undefined> = this.#store.drivers;
  bids: Signal<Bid[]> = this.#store.bids as Signal<Bid[]>;
  isLiveLive = computed(() => this.race().raceStart.minus({ hour: 1 }) < DateTime.local() && this.race().raceStart.plus({ hour: 3 }) > DateTime.local());
  latestUpdate = signal<DateTime | undefined>(undefined);

  #status = toSignal(combineLatest({
    resultStatus: this.#live.resultStatus,
    radioStatus: this.#live.radioStatus,
    pitStopStatus: this.#live.pitStopStatus,
    positionStatus: this.#live.positionStatus,
    intervalStatus: this.#live.intervalStatus,
    stintStatus: this.#live.stintStatus,
    raceControlStatus: this.#live.raceControlStatus,
    sectorStatus: this.#live.sectorStatus,
  }).pipe(
    map(statuses => Object.entries(statuses).map(([name, status]) => ({ name, ...status }))),
  ));

  constructor() {
    const raceControlMessages = inject(RaceControlService);
    effect(() => {
      const race = this.race();
      const drivers = this.drivers();
      race && drivers && raceControlMessages.displayMessages(race, drivers);
    });
  }


  openStatus() {
    this.#bottomSheet.open(LiveStatusComponent, { data: this.#status });
  }

  protected openPlayersTrack() {
    this.#openFullscreen<LiveTrackPlayersComponent, LiveTrackPlayersData>(LiveTrackPlayersComponent, { race: this.race(), drivers: this.drivers()!, bids: this.bids() });
  }

  protected openDriversTrack() {
    this.#openFullscreen<LiveTrackDriversDialogComponent, LiveTrackDriversData>(LiveTrackDriversDialogComponent, { race: this.race(), drivers: this.drivers()! });
  }

  /** The injector of the page is passed on, so the fullscreen uses the same live or relive data */
  #openFullscreen<C, D>(component: ComponentType<C>, data: D) {
    this.#dialog.open<C, D>(component, {
      data,
      injector: this.#injector,
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
    });
  }
}
