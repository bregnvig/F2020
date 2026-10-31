import { formatNumber } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, LOCALE_ID } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { IDriverResult } from '@f2020/data';
import { icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

/** The averages and retirements of a driver side by side in one card, so they fit the width of a phone */
@Component({
  selector: 'f2020-driver-season-numbers',
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Sæsonen</mat-card-title>
      </mat-card-header>
      <mat-card-content class="!pt-4">
        <div class="grid grid-cols-3 divide-x divide-white/10">
          @for (stat of stats(); track stat.label) {
            <div class="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 px-2">
              <fa-icon class="text-pink-400 sm:text-4xl" [icon]="stat.icon" [fixedWidth]="true" />
              <div class="flex flex-col items-center sm:items-start">
                <span class="text-3xl font-light tabular-nums">{{ stat.value }}</span>
                <span class="text-xs opacity-70">{{ stat.label }}</span>
              </div>
            </div>
          }
        </div>
      </mat-card-content>
    </mat-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, FaIconComponent],
})
export class DriverSeasonNumbers {
  #locale = inject(LOCALE_ID);

  readonly result = input.required<IDriverResult>();

  protected readonly stats = computed(() => {
    const { averageGridPosition, averageFinishPosition, retired } = this.result();
    return [
      { icon: icon.fasSteeringWheel, value: formatNumber(averageGridPosition, this.#locale, '1.1-1'), label: 'Gns. start' },
      { icon: icon.fasFlagCheckered, value: formatNumber(averageFinishPosition, this.#locale, '1.1-1'), label: 'Gns. i mål' },
      { icon: icon.farCarCrash, value: retired, label: 'Udgået' },
    ];
  });
}
