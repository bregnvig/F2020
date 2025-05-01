import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { NgClass } from '@angular/common';
import { PolePositionTimePipe, icon } from '@f2020/shared';
import { FaIconComponent, IconName, IconPrefix } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'f2020-display-pole-time',
  template: `
      @if (polePositionTime()) {
        @let comparison = comparePolePositionTimeDiff() && timeComparison();
        <mat-list>
          <mat-list-item>
            <div class="flex justify-between items-center">
              <div class="flex flex-col">
                <small>{{ polePositionTime() | polePositionTime }}</small>
                <small class="text-gray-300">{{ polePositionTimeDiff() }} ms fra pole tiden</small>
              </div>
              @if (comparePolePositionTimeDiff() && comparison) {
                <small class="rounded-full py-1 px-3" [ngClass]="comparison[1]">
                  @if (comparison[0]; as compIcon) {
                    <fa-icon class="text-sm" [icon]="compIcon" />
                  }
                  {{ comparePolePositionTimeDiff() }} ms
                </small>
              }
            </div>
          </mat-list-item>
        </mat-list>
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
  readonly timeComparison = computed((): [[IconPrefix, IconName] | undefined, string] => {
    if (this.polePositionTimeDiff() > this.comparePolePositionTimeDiff()) {
      return [icon.fasAngleUp, 'bg-lime-700']; // Faster
    } else if (this.polePositionTimeDiff() < this.comparePolePositionTimeDiff()) {
      return [icon.fasAngleDown, 'bg-red-700']; // Slower
    }
    return [undefined, 'bg-gray-500']; // Equal
  });
}
