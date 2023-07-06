import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { IRace, RaceUpdatedBy } from '@f2020/data';
import { DriverNamePipe } from '@f2020/driver';
import { DateTimePipe, icon } from '@f2020/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'f2020-race-updated-warning',
  templateUrl: `./race-updated-warning.component.html`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatCardModule, FontAwesomeModule, NgFor, NgIf, DateTimePipe],
  providers: [DriverNamePipe],
})
export class RaceUpdatedWarningComponent {

  infoIcon = icon.farInfo;
  messages: string[] = [];

  constructor(private driverName: DriverNamePipe) { }

  #race: IRace;
  @Input() set race(value: IRace) {
    this.#race = value;

    this.messages = (value?.updatedBy ?? []).map(u => [
      `${u.player.displayName} har ændret`,
      u.close ? this.getCloseChange(u) : '',
      u.close && u.selectedDriver ? ' og ' : '',
      u.selectedDriver ? this.getDriverChange(u) : ''
    ].join(' ')
    );
  }

  get race() {
    return this.#race;
  }


  getCloseChange(u: Partial<RaceUpdatedBy>): string {
    return u.previous
      ? `lukke tidspunktet fra ${u.previous.close.toFormat('HH:mm')} til ${u.close.toFormat('HH:mm')} `
      : `lukke tidspunktet til ${u.close.toFormat('HH:mm')} `;
  }

  getDriverChange(u: Partial<RaceUpdatedBy>): string {
    return u.previous
      ? `udvalgte kører fra ${this.driverName.transform(u.previous.selectedDriver)} til ${this.driverName.transform(u.selectedDriver)}`
      : `udvalgte kører til ${this.driverName.transform(u.selectedDriver)}`;
  }
}
