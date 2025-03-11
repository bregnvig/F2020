import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IRaceResult } from '@f2020/data';

import { MatListModule } from '@angular/material/list';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'f2020-last-year-result',
  template: `
    <mat-list>
      @for (result of raceResult().results; track result.driver.driverId) {
        <mat-list-item>
          <img matListItemAvatar height="40" width="40" [ngSrc]="result.driver.headshotUrl ?? 'assets/loading/yellow.svg'" [alt]="result.driver.name">
          <h5 matListItemTitle>{{ result.driver.name }}</h5>
          <p matListItemMeta class="!text-base !text-white">{{ result.points }}</p>
          <p matListItemLine>{{ result.status }}</p>
        </mat-list-item>
      }
    </mat-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, NgOptimizedImage],
})
export class LastYearResultComponent {
  readonly raceResult = input.required<IRaceResult>();
}
