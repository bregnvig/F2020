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
          <mat-list-item>
            <img matListItemAvatar height="40" width="40" [ngSrc]="driver.headshotUrl ?? 'assets/loading/yellow.svg'" [alt]="driver.name">
            <div class="flex w-full justify-between items-center">
              <div class="flex flex-col">
                <span>{{ driver.name }}</span>
                <small>{{ points()[$index] }} points</small>
              </div>
                @if (comparePoints() && comparePoints()[$index] !== undefined && comparison) {
                  <small class="rounded-full py-1 px-3" [ngClass]="comparison[1]">
                    @if (comparison[0]; as compIcon) {
                      <fa-icon class="text-sm" [icon]="compIcon" />
                    }
                    {{ comparePoints()[$index] }}
                    - {{ compareDriver.code }}
                  </small>
                }
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

    if (a < b) return [icon.fasAngleUp, 'bg-lime-700'];
    if (a > b) return [icon.fasAngleDown, 'bg-red-700'];
    return [undefined, 'bg-gray-500'];
  }

  findCompareDriver(index: number): string {
    return this.compareDriverIds()?.[index];
  }
}
