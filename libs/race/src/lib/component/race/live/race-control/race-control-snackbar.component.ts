import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { RaceControl } from '@f2020/data';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DriverHeadshotComponent } from '@f2020/shared';
import { raceControlIcon } from './race-control-icon';

export interface RaceControlSnackbarData {
  message: RaceControl;
  /** Opens all the messages */
  openAll: () => void;
}

@Component({
  selector: 'f2020-race-control-snackbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex-grow flex items-center gap-3 min-w-0">
      @if (data.message.driver) {
        <sha-driver-headshot class="avatar" [driver]="data.message.driver" />
      } @else {
        <div class="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
          <fa-icon [icon]="icon(data.message.category)" />
        </div>
      }

      <div class="flex-grow flex justify-between min-w-0">
        <p class="line-clamp-2 break-words">{{ data.message.message }}</p>
      </div>
    </div>
  `,
  imports: [DriverHeadshotComponent, FaIconComponent],
  host: {
    class: 'flex cursor-pointer',
    '(click)': 'openAll()',
  },
})
export class RaceControlSnackbarComponent {
  #snackBarRef = inject(MatSnackBarRef);
  protected readonly data = inject<RaceControlSnackbarData>(MAT_SNACK_BAR_DATA);
  protected readonly icon = raceControlIcon;

  protected openAll() {
    this.#snackBarRef.dismiss();
    this.data.openAll();
  }
}
