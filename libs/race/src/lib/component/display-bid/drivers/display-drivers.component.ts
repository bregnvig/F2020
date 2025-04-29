import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { DriverPipe } from '@f2020/driver';
import { MatListModule } from '@angular/material/list';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { icon } from '@f2020/shared';
import { FaIconComponent, IconName, IconPrefix } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'f2020-display-drivers',
  template: `
    <mat-list>
      @for (id of driverIds(); track $index) {
        @let driver = id | driver;
        @let compareDriver = findCompareDriver($index) | driver;
        @let comparison = compareDriver && pointComparison($index);
        @if (driver) {
          <mat-list-item class="driver-item">
            <img matListItemAvatar height="40" width="40" [ngSrc]="driver.headshotUrl ?? 'assets/loading/yellow.svg'" [alt]="driver.name">
            <div class="flex flex-col w-full">
              <div class="flex justify-between text-sm font-medium">
                <span>{{ driver.name }}</span>
                @if (compareDriver) {
                  <span class="text-gray-400">
                    {{ compareDriver.code }}
                  </span>
                }
              </div>
              <div class="flex justify-between">
                <small>{{ points()[$index] }} points</small>
                @if (comparePoints() && comparePoints()[$index] !== undefined && comparison) {
                  <small [ngClass]="comparison[1]">
                    @if (comparison[0]; as compIcon) {
                      <fa-icon class="text-sm" [icon]="compIcon" />
                    }
                    {{ comparePoints()[$index] }} points
                  </small>
                }
              </div>
            </div>
          </mat-list-item>
        }
      }
    </mat-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, NgOptimizedImage, DriverPipe, FaIconComponent, NgClass],
})
export class DisplayDriversComponent {
  driverIndex = signal<number>(0);
  readonly driverIds = input.required<string[]>();
  readonly points = input<number[]>();
  readonly compareDriverIds = input<string[]>();
  readonly comparePoints = input<number[]>();
  pointComparison(index: number): [[IconPrefix, IconName] | undefined, string] | undefined {
    const points = this.points();
    const comparePoints = this.comparePoints();
    if (!points || !comparePoints || points[index] == null || comparePoints[index] == null) {
      return undefined;
    }

    const a = points[index];
    const b = comparePoints[index];

    if (a < b) return [icon.fasAngleUp, 'text-green-500'];
    if (a > b) return [icon.fasAngleDown, 'text-red-500'];
    return [undefined, 'text-gray-500'];
  }

  findCompareDriver(index: number): string {
    return this.compareDriverIds()?.[index];
  }
}
