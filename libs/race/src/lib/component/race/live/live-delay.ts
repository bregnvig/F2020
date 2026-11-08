import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { LiveDelayService, maxLiveDelay } from '@f2020/api';
import { icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

/** Holds the live data back, so it is in step with the TV. The buttons move it a second at a time to fine-tune it */
@Component({
  selector: 'f2020-live-delay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-1">
      <span class="me-2">Forsinkelse</span>
      <button mat-icon-button aria-label="Et sekund mindre" [disabled]="seconds() === 0" (click)="set(seconds() - 1)">
        <fa-icon [icon]="icons.farMinus" />
      </button>
      <mat-slider class="!mx-0 grow" [min]="0" [max]="max" [step]="1">
        <input matSliderThumb aria-label="Forsinkelse i sekunder" [value]="seconds()" (valueChange)="set($event)" />
      </mat-slider>
      <button mat-icon-button aria-label="Et sekund mere" [disabled]="seconds() === max" (click)="set(seconds() + 1)">
        <fa-icon [icon]="icons.farPlus" />
      </button>
      <span class="w-14 text-end tabular-nums">{{ seconds() }} sek.</span>
    </div>
  `,
  imports: [MatIconButton, MatSlider, MatSliderThumb, FaIconComponent],
})
export class LiveDelayComponent {
  #delay = inject(LiveDelayService);

  protected readonly icons = icon;
  protected readonly max = maxLiveDelay;
  protected readonly seconds = this.#delay.seconds;

  protected set(seconds: number) {
    this.#delay.set(seconds);
  }
}
