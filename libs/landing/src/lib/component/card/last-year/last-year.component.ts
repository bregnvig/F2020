import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { RacesStore } from '@f2020/api';
import { RoundResult } from '@f2020/data';
import { icon, PolePositionTimePipe } from '@f2020/shared';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'f2020-last-year',
  templateUrl: './last-year.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, FaIconComponent, RouterLink, MatButtonModule, PolePositionTimePipe],
})
export class LastYearComponent {

  lastYear: Signal<RoundResult>;
  icon = icon.farCalendar;
  url: Signal<string | undefined>;

  constructor() {
    const store = inject(RacesStore);
    this.url = computed(() => store.currentRace()?.url);
    this.lastYear = store.lastYear;
  }
}
