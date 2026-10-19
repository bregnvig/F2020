import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { ReplayResultService, ReplaySpeed, replaySpeeds } from '@f2020/api';
import { Duration } from 'luxon';

const formatSeconds = (seconds: number) => Duration.fromObject({ seconds }).toFormat('h:mm:ss');

/** The speed of the relive, and a slider to move it */
@Component({
  selector: 'f2020-relive-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (duration(); as duration) {
      <div class="flex items-center gap-4">
        <mat-button-toggle-group hideSingleSelectionIndicator aria-label="Hastighed" [value]="speed()" (change)="setSpeed($event.value)">
          @for (speed of speeds; track speed) {
            <mat-button-toggle [value]="speed">{{ speed }}x</mat-button-toggle>
          }
        </mat-button-toggle-group>
        <span class="ms-auto tabular-nums">{{ elapsedText() }} / {{ durationText() }}</span>
      </div>
      <mat-slider class="!mx-0 !w-full" [min]="0" [max]="duration" [step]="1">
        <input matSliderThumb aria-label="Tid i løbet" [value]="sliderValue()" (dragStart)="startDrag()" (dragEnd)="dragging.set(false)" (valueChange)="seek($event)" />
      </mat-slider>
    }
  `,
  imports: [MatButtonToggleGroup, MatButtonToggle, MatSlider, MatSliderThumb],
})
export class ReliveControlsComponent {
  #replay = inject(ReplayResultService);
  #clock = toSignal(this.#replay.clock);

  protected readonly speeds = replaySpeeds;
  protected readonly speed = toSignal(this.#replay.speed, { requireSync: true });
  protected readonly dragging = signal(false);

  protected readonly duration = computed(() => {
    const clock = this.#clock();
    return clock ? Math.round(clock.end.diff(clock.start).as('seconds')) : undefined;
  });
  #elapsed = computed(() => {
    const clock = this.#clock();
    return clock ? Math.round(clock.currentTime.diff(clock.start).as('seconds')) : 0;
  });
  #draggedFrom = 0;
  /** The slider is left alone while it is dragged, so the relive moving on doesn't pull it back */
  protected readonly sliderValue = computed(() => (this.dragging() ? this.#draggedFrom : this.#elapsed()));
  protected readonly elapsedText = computed(() => formatSeconds(this.#elapsed()));
  protected readonly durationText = computed(() => formatSeconds(this.duration() ?? 0));

  protected startDrag() {
    this.#draggedFrom = this.#elapsed();
    this.dragging.set(true);
  }

  protected setSpeed(speed: ReplaySpeed) {
    this.#replay.setSpeed(speed);
  }

  protected seek(seconds: number) {
    const clock = this.#clock();
    clock && this.#replay.seek(clock.start.plus({ seconds }));
  }
}
