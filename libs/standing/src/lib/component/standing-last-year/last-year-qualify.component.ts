import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IQualifyResult } from '@f2020/data';
import { QualifyingTimesComponent } from '../standing-driver/driver-qualifying/qualifying-times/qualifying-times.component';

import { MatListModule } from '@angular/material/list';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'f2020-last-year-qualify',
  template: `
    <mat-list>
      @for (result of qualifyResult().results; track result.driver.driverId) {
        <mat-list-item>
          <img matListItemAvatar height="40" width="40" [ngSrc]="result.driver.headshotUrl ?? 'assets/loading/yellow.svg'" [alt]="result.driver.name">
          <h5 matListItemTitle class="flex flex-row justify-between">{{ result.driver.name }}</h5>
          <p matListItemMeta class="!text-base !text-white">{{ result.position }}</p>
          <p matListItemLine>
            <f2020-qualifying-times [qualifying]="result"></f2020-qualifying-times>
          </p>
        </mat-list-item>
      }
    </mat-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, QualifyingTimesComponent, NgOptimizedImage],
})
export class LastYearQualifyComponent {

  readonly qualifyResult = input.required<IQualifyResult>();
}
