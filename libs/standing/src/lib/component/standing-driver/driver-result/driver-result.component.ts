import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { driverSessionLink } from '../driver-session-link';
import { IDriverResult } from '@f2020/data';

import { MatListModule } from '@angular/material/list';
import { NgOptimizedImage } from '@angular/common';
import { FlagURLPipe } from '@f2020/shared';

@Component({
  selector: 'f2020-driver-result',
  template: `
    <mat-nav-list>
      @for (race of driverResult()?.races ?? []; track $index) {
        <a mat-list-item [routerLink]="link(race.round)">
          <img matListItemAvatar height="40" width="40" [alt]="race.countryCode" [ngSrc]="race.countryCode | flagURL" />
          <h3 matListItemTitle>{{ race.name }}</h3>
          <span matListItemLine>{{ race.results[0].status }}</span>
          <span matListItemMeta>{{ race.results[0].position }}</span>
        </a>
      }
    </mat-nav-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, RouterLink, NgOptimizedImage, FlagURLPipe],
})
export class DriverResultComponent {
  driverResult = input.required<IDriverResult | null | undefined>();
  /** The results are from last year */
  lastYear = input<boolean, string | boolean>(false, { transform: booleanAttribute });

  protected link(round: number) {
    return driverSessionLink(round, 'race', this.lastYear());
  }
}
