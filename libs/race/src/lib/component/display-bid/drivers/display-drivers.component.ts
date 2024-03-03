import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DriverNamePipe } from '@f2020/driver';

import { MatListModule } from '@angular/material/list';

@Component({
    selector: 'f2020-display-drivers',
    template: `
    <mat-list>
      @for (id of driverIds; track id; let i = $index) {
        <mat-list-item>
          <h4 matListItemTitle>{{id | driverName}}</h4>
          @if (points) {
            <small matListItemLine>{{points[i]}} point</small>
          }
        </mat-list-item>
      }
    </mat-list>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatListModule, DriverNamePipe]
})
export class DisplayDriversComponent {

  @Input() driverIds: string[];
  @Input() points: number[];
}
