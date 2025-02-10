import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DriverPipe } from '@f2020/driver';

@Component({
  selector: 'f2020-driver-codes',
  template: `
    @for (driverId of driverIds(); track driverId) {
      {{ (driverId | driver)?.code }}
      @if (!$last) {
        ,
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DriverPipe],
})
export class DriverCodesComponent {

  readonly driverIds = input.required<string[], string[]>({
    transform: value => (value || []).filter(id => !!id),
  });

}
