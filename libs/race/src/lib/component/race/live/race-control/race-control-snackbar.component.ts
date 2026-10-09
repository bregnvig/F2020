import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { RaceControl } from '@f2020/data';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DriverHeadshotComponent, icon } from '@f2020/shared';
import { IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'f2020-race-control-snackbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex-grow flex items-center gap-3 min-w-0">
      @if (data.driver) {
        <sha-driver-headshot class="avatar" [driver]="data.driver"/>
      } @else {
        <div class="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
          <fa-icon [icon]="icons[data.category] ?? flag"/>
        </div>
      }

      <div class="flex-grow flex justify-between min-w-0">
        <p class="line-clamp-2 break-words">{{ data.message }}</p>
      </div>

    </div>
  `,
  imports: [DriverHeadshotComponent, FaIconComponent],
  host: {
    class: 'flex',
  },
})
export class RaceControlSnackbarComponent {
  data = inject<RaceControl>(MAT_SNACK_BAR_DATA);

  flag = icon.fasFlagCheckered;
  icons: Record<string, [IconPrefix, IconName]> = {
    'Drs': icon.falRocketLaunch,
    'Flag': icon.fasFlagCheckered,
    'SafetyCar': icon.fasSafetyCar,
    'CarEvent': icon.farCarCrash,
    'Other': icon.farInfo,
  };
}
