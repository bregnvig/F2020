import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RacesStore } from '@f2020/api';
import { RoundResult } from '@f2020/data';
import { FlagURLPipe, LoadingComponent } from '@f2020/shared';
import { LastYearQualifyComponent } from './last-year-qualify.component';
import { LastYearResultComponent } from './last-year-result.component';

@Component({
  selector: 'f2020-standing-last-year',
  template: `
@if (round()) {
  <mat-toolbar color="primary">
    <img class="avatar" [src]="round().result.countryCode | flagURL" alt="Løbs flag">
    <span class="text-ellipsis overflow-hidden">Sidste år - {{ round().result.name }}</span>
  </mat-toolbar>
  <div class="max-w-3xl mx-auto">
    <mat-tab-group>
      <mat-tab label="Kvalifikation">
        <f2020-last-year-qualify [qualifyResult]="round().qualify"></f2020-last-year-qualify>
      </mat-tab>
      <mat-tab label="Resultat">
        <f2020-last-year-result [raceResult]="round().result"></f2020-last-year-result>
      </mat-tab>
    </mat-tab-group>
  </div>
} @else {
  <sha-loading></sha-loading>
}
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, MatTabsModule, LastYearQualifyComponent, LastYearResultComponent, LoadingComponent, FlagURLPipe],
})
export class StandingLastYearComponent {

  round: Signal<RoundResult>;

  constructor() {
    const store = inject(RacesStore);
    store.loadLastYear();
    this.round = store.lastYear;
  }
}
