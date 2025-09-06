import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import { IDriverSector } from '@f2020/data';
import { LiveSectorComponent } from './live-sector.component';

@Component({
  selector: 'f2020-live-sector-status',
  template: `
    <f2020-live-sector class="me-2" [sector]="status()?.sector1" />
    <f2020-live-sector class="me-2" [sector]="status()?.sector2" />
    <f2020-live-sector [sector]="status()?.sector3" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LiveSectorComponent,
  ],
})

export class LiveSectorStatusComponent {
  status = input.required<IDriverSector | undefined>();
  a = effect(() => console.log(this.status()));
}
