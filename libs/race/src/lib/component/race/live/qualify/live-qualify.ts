import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatCard, MatCardAvatar, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { ActivatedRoute } from '@angular/router';
import { isQualifyLive, OpenF1WSSService, provideQualifyResultService, QualifyResultProvider, qualifySessionData, RaceStore } from '@f2020/api';
import { Bid, IDriver, IDriverSector } from '@f2020/data';
import { Session } from '@f2020/openf1';
import { CardPageComponent, DateTimePipe, FlagURLPipe, icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { combineLatest, map, switchMap } from 'rxjs';
import { toMap, truthy } from '@f2020/tools';
import { LiveRadioComponent } from '../live-radio.component';
import { LiveStatusComponent } from '../live-status.component';
import { RaceControlService } from '../race-control';
import { LiveQualifyBidsComponent } from './live-qualify-bids';
import { LiveQualifyDriversComponent } from './live-qualify-drivers';

@Component({
  selector: 'f2020-live-qualify',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sha-card-page cols="md:grid-cols-2">
      @if (race(); as race) {
        <mat-card>
          <mat-card-header>
            <img mat-card-avatar height="40" width="40" [ngSrc]="race | flagURL" [alt]="race.countryCode" (click)="openStatus()">
            <mat-card-title>{{ isLive ? 'Live kvalifikation' : 'Genoplev kvalifikationen' }}</mat-card-title>
            <mat-card-subtitle>
              @if (latestUpdate(); as latestUpdate) {
                Sidst opdateret {{ latestUpdate | dateTime: 'HH:mm.ss' }}
              }
              @if (error()) {
                <fa-icon class="text-red-400 mx-2" [icon]="icons.falTireFlat" />
                <span class="text-red-400">{{ error() }}</span>
              }
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <f2020-live-qualify-bids [race]="race" [bids]="bids()" [result]="result()" />
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header>
            <mat-card-title>Kvalifikation</mat-card-title>
            @if (result(); as result) {
              <mat-card-subtitle>Q{{ result.phase }}{{ result.phaseFinished ? ' er slut' : '' }}</mat-card-subtitle>
            }
          </mat-card-header>
          <mat-card-content>
            <f2020-live-qualify-drivers class="block mt-3" [result]="result()" [sectors]="sectors()" />
          </mat-card-content>
        </mat-card>
        <mat-card class="md:col-span-2">
          <mat-card-header>
            <mat-card-title>Holdbeskeder</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <f2020-live-radio class="block mt-3" [race]="race" [drivers]="drivers()" />
          </mat-card-content>
        </mat-card>
      }
    </sha-card-page>
  `,
  imports: [
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatCardAvatar,
    CardPageComponent,
    FlagURLPipe,
    NgOptimizedImage,
    DateTimePipe,
    FaIconComponent,
    LiveQualifyBidsComponent,
    LiveQualifyDriversComponent,
    LiveRadioComponent,
  ],
  providers: [
    provideQualifyResultService(),
    RaceControlService,
    OpenF1WSSService,
  ],
})
export class LiveQualifyComponent {
  #store = inject(RaceStore);
  #live = inject(QualifyResultProvider);
  #bottomSheet = inject(MatBottomSheet);

  protected readonly icons = icon;
  protected readonly isLive = isQualifyLive(inject(ActivatedRoute).snapshot.data[qualifySessionData] as Session);
  protected readonly race = this.#store.race;
  protected readonly drivers: Signal<IDriver[] | undefined> = this.#store.drivers;
  protected readonly bids = computed(() => (this.#store.bids() ?? []) as Bid[]);

  #raceAndDrivers$ = combineLatest({
    race: toObservable(this.race).pipe(truthy()),
    drivers: toObservable(this.drivers).pipe(truthy()),
  });
  protected readonly result = toSignal(this.#raceAndDrivers$.pipe(
    switchMap(({ race, drivers }) => this.#live.getResult(race, drivers)),
  ));
  protected readonly sectors = toSignal(this.#raceAndDrivers$.pipe(
    switchMap(({ race, drivers }) => this.#live.getSectorStatus(race, drivers)),
    map(sectors => sectors.reduce(toMap<IDriverSector, string>(sector => sector.driver.driverId), new Map<string, IDriverSector>())),
  ));
  protected readonly latestUpdate = toSignal(this.#live.resultStatus.pipe(map(status => status.latestUpdate)));
  protected readonly error = toSignal(this.#live.resultStatus.pipe(map(status => status.error?.statusText)));

  #status = toSignal(combineLatest({
    resultStatus: this.#live.resultStatus,
    radioStatus: this.#live.radioStatus,
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

  protected openStatus() {
    this.#bottomSheet.open(LiveStatusComponent, { data: this.#status });
  }
}
