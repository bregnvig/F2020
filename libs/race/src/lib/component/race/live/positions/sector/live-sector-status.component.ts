import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IDriverSector } from '@f2020/data';
import { LiveSectorComponent } from './live-sector.component';

@Component({
  selector: 'f2020-live-sector-status',
  template: `
    <!-- The sectors are made again for each lap, so they are animated as they come in -->
    @for (lap of [status()?.sectorsLap]; track lap) {
      <span class="flex">
        <f2020-live-sector class="me-2" [sector]="status()?.sector1" />
        <f2020-live-sector class="me-2" [sector]="status()?.sector2" />
        <f2020-live-sector [sector]="status()?.sector3" />
      </span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LiveSectorComponent,
  ],
})

export class LiveSectorStatusComponent {
  status = input.required<IDriverSector | undefined>();
  // a = effect(() => {
  //   const driver = this.status()?.driver;
  //   if (driver?.driverId === 'ver') {
  //     console.debug(this.status().sector1.mini, this.status().sector2?.mini, this.status().sector3?.mini);

  //   }
  // });
}
