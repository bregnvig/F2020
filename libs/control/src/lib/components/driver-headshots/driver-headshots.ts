import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { DriverPipe } from '@f2020/driver';
import { DriverHeadshotComponent } from '@f2020/shared';

/**
 * Headshots of the drivers in a row, aligned to the right, with the driver code as tooltip.
 */
@Component({
  selector: 'f2020-driver-headshots',
  template: `
    @for (driverId of driverIds(); track $index) {
      @let driver = driverId | driver;
      <sha-driver-headshot [driver]="driver" [matTooltip]="driver?.code ?? ''"/>
    }
  `,
  host: {
    class: 'flex flex-row items-center gap-1 ml-auto',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DriverPipe, DriverHeadshotComponent, MatTooltip],
})
export class DriverHeadshotsComponent {
  readonly driverIds = input.required<string[], (string | null | undefined)[] | null | undefined>({
    transform: value => (value ?? []).filter(id => !!id),
  });
}
