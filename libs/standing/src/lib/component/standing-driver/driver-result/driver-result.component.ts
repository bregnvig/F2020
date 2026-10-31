import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IDriverResult } from '@f2020/data';

import { MatListModule } from '@angular/material/list';
import { NgOptimizedImage } from '@angular/common';
import { FlagURLPipe } from '@f2020/shared';

@Component({
  selector: 'f2020-driver-result',
  template: `
    <mat-list>
      @for (race of driverResult()?.races ?? []; track $index) {
        <mat-list-item>
          <img matListItemAvatar height="40" width="40" [alt]="race.countryCode" [ngSrc]="race.countryCode | flagURL" />
          <h3 matListItemTitle>{{ race.name }}</h3>
          <span matListItemLine>{{ race.results[0].status }}</span>
          <span matListItemMeta>{{ race.results[0].position }}</span>
        </mat-list-item>
      }
    </mat-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, NgOptimizedImage, FlagURLPipe],
})
export class DriverResultComponent {
  driverResult = input.required<IDriverResult | null | undefined>();
}
