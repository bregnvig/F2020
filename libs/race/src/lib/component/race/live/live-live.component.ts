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
import { LiveTrackPlayersComponent, LiveTrackPlayersData } from './track/live-track-players';
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
            <button mat-icon-button class="!hidden md:!inline-block ms-auto" aria-label="Vis spillerne på banen" (click)="openTrack()">
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
            <f2020-live-race [race]="race()" [bids]="bids()" [drivers]="drivers()" (latestUpdate)="latestUpdate.set($event)"
                             (standings)="standings.set($event)" />
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
        <mat-card class="!hidden md:!flex lg:col-span-2">
          <mat-card-header>
            <mat-card-title>Banen</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <f2020-live-track-drivers class="block mt-3" [race]="race()" [drivers]="drivers()" />
          </mat-card-content>
        </mat-card>
        <mat-card class="lg:col-span-2">
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
  protected readonly standings = signal<Bid[]>([]);

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

  /** The injector of the page is passed on, so the fullscreen uses the same live or relive data */
  protected openTrack() {
    this.#dialog.open<LiveTrackPlayersComponent, LiveTrackPlayersData>(LiveTrackPlayersComponent, {
      data: { race: this.race(), drivers: this.drivers()!, bids: this.standings.asReadonly() },
      injector: this.#injector,
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
    });
  }
}
