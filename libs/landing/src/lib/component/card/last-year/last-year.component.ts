import { ChangeDetectionStrategy, Component, effect, HostBinding, inject, Signal } from '@angular/core';
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

  @HostBinding('hidden') isHidden = true;
  lastYear: Signal<RoundResult>;
  icon = icon.farCalendar;

  constructor() {
    const store = inject(RacesStore);
    effect(() => store.currentRace() && store.loadLastYear());
    this.lastYear = store.lastYear;
    effect(() => this.isHidden = !store.lastYear());
  }
}
