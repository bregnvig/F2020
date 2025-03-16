import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DriverPipe } from '@f2020/driver';

import { MatListModule } from '@angular/material/list';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'f2020-display-drivers',
  template: `
    <mat-list>
      @for (id of driverIds(); track $index) {
        @let driver = id | driver;
        @if (driver) {
          <mat-list-item>
            <img matListItemAvatar height="40" width="40" [ngSrc]="driver.headshotUrl ?? 'assets/loading/yellow.svg'" [alt]="driver.name">
            <h4 matListItemTitle>{{ driver.name }}</h4>
            @if (points()) {
              <small matListItemLine>{{ points()[$index] }} point</small>
            }
          </mat-list-item>
        }
      }
    </mat-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, NgOptimizedImage, DriverPipe],
})
export class DisplayDriversComponent {

  readonly driverIds = input.required<string[]>();
  readonly points = input<number[]>();
}
