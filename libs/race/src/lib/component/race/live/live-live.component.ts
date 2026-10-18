import { ChangeDetectionStrategy, Component, effect, inject, Signal } from '@angular/core';
import { OpenF1WSSService, provideRaceResultService, RaceStore } from '@f2020/api';
import { Bid, IDriver } from '@f2020/data';
import { CardPageComponent } from '@f2020/shared';
import { LiveChampionshipComponent } from './live-championship';
import { LiveFastestLapsComponent } from './live-fastest-laps';
import { LivePositionsCardComponent } from './live-positions-card';
import { LiveRaceCardComponent } from './live-race-card';
import { LiveRadioCardComponent } from './live-radio-card';
import { LiveStrategyComponent } from './live-strategy';
import { LiveTrackCardComponent } from './live-track-card';
import { RaceControlService } from './race-control';

@Component({
  selector: 'f2020-live-live',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sha-card-page cols="lg:grid-cols-2">
      @if (race() && drivers(); as drivers) {
        <f2020-live-race-card [race]="race()" [drivers]="drivers" [bids]="bids()" />
        <f2020-live-positions-card [race]="race()" [drivers]="drivers" />
        <f2020-live-track-card [race]="race()" [drivers]="drivers" />
        <f2020-live-strategy [race]="race()" [drivers]="drivers" />
        <f2020-live-radio-card [race]="race()" [drivers]="drivers" />
        <f2020-live-fastest-laps [race]="race()" [drivers]="drivers" />
        <f2020-live-championship [race]="race()" [drivers]="drivers" type="drivers" />
        <f2020-live-championship [race]="race()" [drivers]="drivers" type="teams" />
      }
    </sha-card-page>
  `,
  imports: [
    CardPageComponent,
    LiveRaceCardComponent,
    LivePositionsCardComponent,
    LiveTrackCardComponent,
    LiveRadioCardComponent,
    LiveStrategyComponent,
    LiveFastestLapsComponent,
    LiveChampionshipComponent,
  ],
  providers: [
    provideRaceResultService(),
    RaceControlService,
    OpenF1WSSService,
  ],
})
export class LiveLiveComponent {
  #store = inject(RaceStore);

  protected readonly race = this.#store.race;
  protected readonly drivers: Signal<IDriver[] | undefined> = this.#store.drivers;
  protected readonly bids: Signal<Bid[]> = this.#store.bids as Signal<Bid[]>;

  constructor() {
    const raceControlMessages = inject(RaceControlService);
    effect(() => {
      const race = this.race();
      const drivers = this.drivers();
      race && drivers && raceControlMessages.displayMessages(race, drivers);
    });
  }
}
