import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IDriverResult } from '@f2020/data';

import { MatListModule } from '@angular/material/list';

@Component({
    selector: 'f2020-driver-result',
    template: `
    <mat-list>
      @for (race of driverResult()?.races; track $index) {
        <mat-list-item>
          <h3 matListItemTitle>{{ race.name }}</h3>
          <span matListItemLine>{{ race.results[0].status }}</span>
          <span matListItemMeta>{{ race.results[0].position }}</span>
        </mat-list-item>
      }
    </mat-list>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatListModule]
})
export class DriverResultComponent {
  driverResult = input.required<IDriverResult>();
}
