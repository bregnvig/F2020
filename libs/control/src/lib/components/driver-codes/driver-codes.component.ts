
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DriverPipe } from '@f2020/driver';

@Component({
  selector: 'f2020-driver-codes',
  template: `
    @for (driverId of driverIds; track driverId; let last = $last) {
      {{(driverId | driver)?.code}}
      @if (!last) {
        ,
      }
    }
    `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [DriverPipe],
})
export class DriverCodesComponent {

  #driverIds: string[];

  @Input({ required: true }) set driverIds(value: string[]) {
    this.#driverIds = (value || []).filter(id => !!id);
  }

  get driverIds() {
    return this.#driverIds;
  }

}
