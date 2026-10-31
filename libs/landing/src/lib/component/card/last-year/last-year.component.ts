import { ChangeDetectionStrategy, Component, computed, effect, inject, Signal } from '@angular/core';
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
  host: {
    '[hidden]': 'closed() || loading()',
  },
})
export class LastYearComponent {
  lastYear: Signal<RoundResult>;
  icon = icon.farCalendar;
  url: Signal<string | undefined>;
  loading: Signal<boolean>;
  /** Once the race is closed, the weekend has begun and last year is no longer of interest */
  closed: Signal<boolean>;

  constructor() {
    const store = inject(RacesStore);
    this.closed = computed(() => store.currentRace()?.state === 'closed');
    effect(() => store.currentRace() && !this.closed() && store.loadLastYear());
    this.url = computed(() => store.currentRace()?.url);
    this.lastYear = store.lastYear;
    // Without a current race there is nothing to load
    this.loading = computed(() => !!store.currentRace() && !store.lastYearLoaded());
  }
}
