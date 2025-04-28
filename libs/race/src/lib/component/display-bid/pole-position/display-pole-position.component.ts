import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { NgClass } from '@angular/common';
import { PolePositionTimePipe, icon } from '@f2020/shared';
import { FaIconComponent, IconName, IconPrefix } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'f2020-display-pole-time',
  template: `
      @if (polePositionTime()) {
        @let comparison = comparePolePositionTimeDiff() && timeComparison(polePositionTimeDiff(), comparePolePositionTimeDiff() );

        <mat-list-item>
            <div class="flex justify-between">
              <small>{{ polePositionTime() | polePositionTime }}</small>
              @if (comparePolePositionTime()) {
                <small class="text-gray-400">
                  {{ comparePolePositionTime() | polePositionTime }}
                </small>
              }
            </div>
            @if (polePositionTimeDiff() !== undefined) {
              <div class="flex justify-between">
                <small class="text-gray-300">{{ polePositionTimeDiff() }} ms fra pole tiden</small>
                @if (comparePolePositionTimeDiff() && comparison) {
                  <small [ngClass]="comparison[1]">
                    @if (comparison[0]; as compIcon) {
                      <fa-icon class="text-sm" [icon]="compIcon" />
                    }
                    {{ comparePolePositionTimeDiff() }} ms
                  </small>
                }
              </div>
            }
        </mat-list-item>
      }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, NgClass, PolePositionTimePipe, FaIconComponent],
})
export class DisplayPoleTimeComponent {
  readonly polePositionTime = input.required<number>();
  readonly polePositionTimeDiff = input<number>();
  readonly comparePolePositionTime = input<number>();
  readonly comparePolePositionTimeDiff = input<number>();

  timeComparison(time: number, compareTime: number): [[IconPrefix, IconName] | undefined, string] {
    if (time > compareTime) {
      return [icon.fasAngleUp, 'text-green-500']; // Faster
    } else if (time < compareTime) {
      return [icon.fasAngleDown, 'text-red-500']; // Slower
    }
    return [undefined, 'text-gray-500']; // Equal
  }
}
