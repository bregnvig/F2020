import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DriverPipe } from '@f2020/driver';
import { MatListModule } from '@angular/material/list';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { pointsDiffIcon } from '../display-bid.component';
import { isNullish, nullish } from '@f2020/tools';

@Component({
  selector: 'f2020-display-drivers',
  template: `
    <mat-list>
      @for (id of driverIds(); track $index) {
        @let driver = id | driver;
        @let compareDriver = findCompareDriver($index) | driver;
        @let comparison = compareDriver && pointsDiffIcon(points()[$index], comparePoints()[$index]);
        @if (driver) {
          <mat-list-item>
            <img matListItemAvatar height="40" width="40" [ngSrc]="driver.headshotUrl ?? 'assets/loading/yellow.svg'" [alt]="driver.name">
            <div class="flex w-full justify-between items-center">
              <div class="flex flex-col">
                <span>{{ driver.name }}</span>
                @if (points()?.[$index] !== null && points()[$index] !== undefined) {
                  <small>{{ points()[$index] }} points</small>
                }
              </div>
              @if (comparePoints() && comparePoints()[$index] !== undefined && comparison) {
                <small class="rounded-full py-1 px-3" [ngClass]="comparison[1]">
                  @if (comparison[0]; as compIcon) {
                    <fa-icon class="text-sm" [icon]="compIcon"/>
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
  readonly driverIds = input.required<string[]>();
  readonly points = input<number[] | undefined, number[] | nullish>([], {
    transform: value => value?.length && value.every(v => !isNullish(value)) ? value : undefined,
  });
  readonly compareDriverIds = input<string[]>();
  readonly comparePoints = input<number[]>();

  findCompareDriver(index: number): string {
    return this.compareDriverIds()?.[index];
  }

  readonly pointsDiffIcon = pointsDiffIcon;
}
