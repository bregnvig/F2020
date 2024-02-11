import { ChangeDetectionStrategy, Component, Signal } from '@angular/core';
import { RacesStore } from '@f2020/api';
import { RoundResult } from '@f2020/data';
import { FlagURLPipe, LoadingComponent } from '@f2020/shared';
import { LastYearResultComponent } from './last-year-result.component';
import { LastYearQualifyComponent } from './last-year-qualify.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'f2020-standing-last-year',
  templateUrl: './standing-last-year.component.html',
  styleUrls: ['./standing-last-year.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgIf, MatToolbarModule, MatTabsModule, LastYearQualifyComponent, LastYearResultComponent, LoadingComponent, AsyncPipe, FlagURLPipe],
})
export class StandingLastYearComponent {

  round: Signal<RoundResult>;

  constructor(store: RacesStore) {
    store.loadLastYear();
    this.round = store.lastYear;
  }
}
