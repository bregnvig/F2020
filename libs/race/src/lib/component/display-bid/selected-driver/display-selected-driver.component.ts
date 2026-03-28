import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { FaIconComponent, IconName, IconPrefix } from '@fortawesome/angular-fontawesome';
import { icon } from '@f2020/shared';
import { NgClass } from '@angular/common';
import { filterUndefined } from '@f2020/tools';
import { SelectedDriverValue } from '@f2020/data';

interface SelectedDriverComparison {
  grid: number;
  gridPoints?: number;
  compareGrid?: number;
  compareGridPoints?: number;
  finish: number;
  finishPoints?: number;
  compareFinish?: number;
  compareFinishPoints?: number;
}

@Component({
  selector: 'f2020-display-selected-driver',
  template: `
    @let driver = selectedDriverComparison();
    @let comparison = driver?.compareGrid && pointsDiffIcon();
    <mat-list>
      <mat-list-item>
        <div class="flex justify-between items-center">
          <div class="flex flex-col">
            <span>Startede som nummer {{ driver.grid }}</span>
            @if (driver.gridPoints !== undefined) {
              <small class="text-sm">{{ driver.gridPoints }} point</small>
            }
          </div>
          @if (driver.compareGrid) {
            <div class="flex">
              <small class="rounded-full py-1 px-3" [ngClass]="comparison.grid[1]">
                @if (comparison.grid[0]; as compIcon) {
                  <fa-icon [icon]="compIcon" />
                }
                @if (driver.compareGridPoints !== undefined) {
                  {{ driver.compareGridPoints }}
                  -
                }
                P{{ driver.compareGrid }}
              </small>
            </div>
          }
        </div>
      </mat-list-item>
      @if (driver.finish) {
        <mat-list-item class="mt-3">
          <div class="flex justify-between items-center">
            <div class="flex flex-col">
              <span>Sluttede som nummer {{ driver.finish }}</span>
              @if (driver.finishPoints !== undefined) {
                <small class="text-sm">{{ driver.finishPoints }} point</small>
              }
            </div>
            @if (driver.compareFinish) {
              <div class="flex">
                <small class="rounded-full py-1 px-3" [ngClass]="comparison.finish[1]">
                  @if (comparison.finish[0]; as compIcon) {
                    <fa-icon [icon]="compIcon" />
                  }
                  @if (driver.compareFinishPoints !== undefined) {
                    {{ driver.compareFinishPoints }} -
                  }
                  P{{ driver.compareFinish }}
                </small>
              </div>
            }
          </div>
        </mat-list-item>
      }
    </mat-list>
  `,
  imports: [MatListModule, NgClass, FaIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      mat-list-item .mdc-list-item__secondary-text::before {
        display: none;
      }
    }
  `],
})
export class DisplaySelectedDriverComponent {

  readonly pointsDiffIcon = computed(() => {
    const { gridPoints, compareGridPoints, finishPoints, compareFinishPoints } = this.selectedDriverComparison();

    const compare = (a: number, b: number): [[IconPrefix, IconName] | undefined, string] => {
      if (a < b) return [icon.fasAngleUp, 'bg-lime-700'];
      if (a > b) return [icon.fasAngleDown, 'bg-red-700'];
      return [undefined, 'bg-gray-500'];
    };

    return {
      grid: compare(gridPoints, compareGridPoints),
      finish: compare(finishPoints, compareFinishPoints),
    };
  });

  selectedDriver = input.required<SelectedDriverValue>();
  compareWith = input<Partial<SelectedDriverValue>>();

  selectedDriverComparison = computed(() => {
    const selectedDriver = this.selectedDriver();
    if (!selectedDriver) {
      return undefined;
    }
    return filterUndefined({
      grid: selectedDriver.grid,
      gridPoints: selectedDriver.gridPoints,
      finish: selectedDriver.finish,
      finishPoints: selectedDriver.finishPoints,
      compareGrid: this.compareWith()?.grid,
      compareGridPoints: this.compareWith()?.gridPoints,
      compareFinish: this.compareWith()?.finish,
      compareFinishPoints: this.compareWith()?.finishPoints,
    }) as SelectedDriverComparison;
  });
}
