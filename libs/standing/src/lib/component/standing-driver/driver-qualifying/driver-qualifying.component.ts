import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IQualifyResult } from '@f2020/data';
import { QualifyingTimesComponent } from './qualifying-times/qualifying-times.component';

import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'f2020-driver-qualifying',
  template: `
    <mat-list>
      @for (result of qualifyResults(); track $index) {
        <mat-list-item>
          <h3 matListItemTitle>{{ result.name }}</h3>
          <span matListItemLine><f2020-qualifying-times [qualifying]="result.results[0]"></f2020-qualifying-times></span>
          <span class="focus-meta" matListItemMeta>{{ result.results[0].position }}</span>
        </mat-list-item>
      }
    </mat-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatListModule, QualifyingTimesComponent],
})
export class DriverQualifyingComponent {
  qualifyResults = input.required<IQualifyResult[]>();
}
