import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { FaIconComponent, IconName, IconPrefix } from '@fortawesome/angular-fontawesome';
import { icon } from '@f2020/shared';
import { NgClass } from '@angular/common';

export interface SelectedDriver {
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
    @let dsp = driverStartPosition();
    @let comparison = dsp.compareGrid && pointsDiffIcon();
    <mat-list>
      <mat-list-item>
        <div class="flex justify-between items-center">
          <div class="flex flex-col">
            <span>Startede som nummer {{ dsp.grid }}</span>
            <small class="text-sm">{{ dsp.gridPoints }} point</small>
          </div>
          @if (dsp.compareGrid) {
            <div class="flex">
              <small class="rounded-full py-1 px-3" [ngClass]="comparison.grid[1]">
                @if (comparison.grid[0]; as compIcon) {
                  <fa-icon [icon]="compIcon" />
                }
                {{ dsp.compareGridPoints }}
                - P{{ dsp.compareGrid }}
              </small>
            </div>
          }
        </div>
      </mat-list-item>
      @if (dsp.finish) {
        <mat-list-item class="mt-3">
          <div class="flex justify-between items-center">
            <div class="flex flex-col">
              <span>Sluttede som nummer {{ dsp.finish }}</span>
              <small class="text-sm">{{ dsp.finishPoints }} point</small>
            </div>
            @if (dsp.compareFinish) {
              <div class="flex">
                <small class="rounded-full py-1 px-3" [ngClass]="comparison.grid[1]">
                  @if (comparison.grid[0]; as compIcon) {
                    <fa-icon [icon]="compIcon" />
                  }
                  {{ dsp.compareFinishPoints }}
                  - P{{ dsp.compareFinish }}
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
  `]
})
export class DisplaySelectedDriverComponent {
  driverStartPosition = input.required<SelectedDriver>();
  readonly pointsDiffIcon = computed(() => {
    const { gridPoints, compareGridPoints, finishPoints, compareFinishPoints } = this.driverStartPosition();

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
}
