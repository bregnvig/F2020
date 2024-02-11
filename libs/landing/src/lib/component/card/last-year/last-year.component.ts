import { ChangeDetectionStrategy, Component, effect, HostBinding, Signal } from '@angular/core';
import { RacesStore } from '@f2020/api';
import { RoundResult } from '@f2020/data';
import { icon, PolePositionTimePipe } from '@f2020/shared';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatCardModule } from '@angular/material/card';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'f2020-last-year',
  templateUrl: './last-year.component.html',
  styleUrls: ['./last-year.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgIf, MatCardModule, FontAwesomeModule, RouterLink, MatButtonModule, AsyncPipe, PolePositionTimePipe],
})
export class LastYearComponent {

  @HostBinding('hidden') isHidden = true;
  lastYear: Signal<RoundResult>;
  icon = icon.farCalendar;

  constructor(store: RacesStore) {
    this.lastYear = store.lastYear;
    store.loadLastYear();
    effect(() => this.isHidden = !this.lastYear());
  }
}
