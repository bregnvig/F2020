import { Injectable } from '@angular/core';
import { IDriver } from '@f2020/data';
import { DriverService } from '../service/driver.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '../../store';

export interface DriversState {
  drivers?: IDriver[],
  loaded: boolean; // has the Driver list been loaded
  error?: string | null; // last none error (if any)
}

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class DriversStore extends Store<DriversState> {

  drivers = this.state.drivers;
  loaded = this.state.loaded;

  constructor(private service: DriverService) {
    super({ loaded: false });
  }

  loadDrivers() {
    if (!this.loaded()) {
      this.service.drivers$.pipe(
        untilDestroyed(this),
      ).subscribe(drivers => this.setState(() => ({ drivers, loaded: true })));
    }
  }

}
