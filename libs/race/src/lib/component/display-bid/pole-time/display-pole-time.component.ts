import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { NgClass } from '@angular/common';
import { PolePositionTimePipe } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { pointsDiffIcon } from '../display-bid.component';

@Component({
  selector: 'f2020-display-pole-time',
  template: `
      @if (polePositionTime()) {
        @let comparison = comparePolePositionTimeDiff() && pointsDiffIcon(comparePolePositionTimeDiff(), polePositionTimeDiff());
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
  readonly pointsDiffIcon = pointsDiffIcon;
}
