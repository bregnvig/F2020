import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { PolePositionTimePipe } from '@f2020/shared';
import { DisplayPointsDiffComponent } from '../diff/display-points-diff.component';

@Component({
  selector: 'f2020-display-pole-time',
  template: `
    @if (polePositionTime()) {
      <mat-list>
        <mat-list-item>
          <div class="flex justify-between items-center">
            <div class="flex flex-col">
              <small>{{ polePositionTime() | polePositionTime }}</small>
              <small class="text-gray-300">{{ polePositionTimeDiff() }} ms fra pole tiden</small>
            </div>
            @if (comparePolePositionTimeDiff()) {
              <f2020-display-points-diff [value]="polePositionTimeDiff()" [compareWith]="comparePolePositionTimeDiff()" flipValues postfix="ms"/>
            } @else if (comparePolePositionTime()) {
              <small class="rounded-full py-1 px-3 bg-gray-500">
                {{ comparePolePositionTime() | polePositionTime }}
              </small>
            }
          </div>
        </mat-list-item>
      </mat-list>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, PolePositionTimePipe, DisplayPointsDiffComponent],
})
export class DisplayPoleTimeComponent {
  readonly polePositionTime = input.required<number>();
  readonly polePositionTimeDiff = input<number>();
  readonly comparePolePositionTime = input<number>();
  readonly comparePolePositionTimeDiff = input<number>();
}
