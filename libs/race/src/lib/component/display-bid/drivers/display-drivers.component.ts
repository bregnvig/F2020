import { ChangeDetectionStrategy, Component, Input, input } from '@angular/core';
import { DriverNamePipe } from '@f2020/driver';

import { MatListModule } from '@angular/material/list';

@Component({
    selector: 'f2020-display-drivers',
    template: `
    <mat-list>
      @for (id of driverIds(); track $index) {
        <mat-list-item>
          <h4 matListItemTitle>{{ id | driverName }}</h4>
          @if (points) {
            <small matListItemLine>{{ points()[$index] }} point</small>
          }
        </mat-list-item>
      }
    </mat-list>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatListModule, DriverNamePipe]
})
export class DisplayDriversComponent {

  readonly driverIds = input.required<string[]>();
  readonly points = input<number[]>();
}
