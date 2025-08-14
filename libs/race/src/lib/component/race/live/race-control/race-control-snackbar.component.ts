import { Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { RaceControl } from '@f2020/data';
import { NgOptimizedImage } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { icon } from '@f2020/shared';
import { IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'f2020-race-control-snackbar',
  template: `
    <div class="flex-grow flex items-center gap-3 min-w-0">
      @if (data.driver?.headshotUrl) {
        <img
          class="avatar"
          [ngSrc]="data.driver.headshotUrl"
          [alt]="data.driver.name"
          width="40"
          height="40"
        />
      } @else {
        <div class="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
          <fa-icon [icon]="icons[data.category] ?? flag"/>
        </div>
      }

      <div class="flex-grow flex justify-between min-w-0">
        <p class="line-clamp-2 break-words me-2">{{ data.message }}</p>
        <button (click)="dismiss()">
          <fa-icon [icon]="close"/>
        </button>
      </div>

    </div>
  `,
  imports: [NgOptimizedImage, FaIconComponent],
  host: {
    class: 'flex',
  },
})
export class RaceControlSnackbarComponent {
  data = inject<RaceControl>(MAT_SNACK_BAR_DATA);
  #snackBarRef = inject(MatSnackBarRef<RaceControlSnackbarComponent>);

  flag = icon.fasFlagCheckered;
  icons: Record<string, [IconPrefix, IconName]> = {
    'Drs': icon.falRocketLaunch,
    'Flag': icon.fasFlagCheckered,
    'SafetyCar': icon.fasSafetyCar,
    'CarEvent': icon.farCarCrash,
    'Other': icon.farInfo,
  };
  close = icon.farTrash;

  dismiss(): void {
    this.#snackBarRef.dismiss();
  }
}
