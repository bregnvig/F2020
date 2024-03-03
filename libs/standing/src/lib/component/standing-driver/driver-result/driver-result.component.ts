import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IDriverResult } from '@f2020/data';

import { MatListModule } from '@angular/material/list';

@Component({
    selector: 'f2020-driver-result',
    templateUrl: './driver-result.component.html',
    styleUrls: ['./driver-result.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatListModule],
})
export class DriverResultComponent {
  @Input() driverResult: IDriverResult;
}
