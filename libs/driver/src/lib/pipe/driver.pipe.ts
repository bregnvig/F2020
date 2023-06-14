import { ChangeDetectorRef, Pipe, PipeTransform } from '@angular/core';
import { DriversFacade } from '../+state/drivers.facade';
import { IDriver } from '@f2020/data';

@Pipe({
    name: 'driver',
    pure: false,
    standalone: true,
})
export class DriverPipe implements PipeTransform {

  private previousCode: string;
  private driver: IDriver;
  private drivers: IDriver[];

  constructor(facade: DriversFacade, changeDetectorRef: ChangeDetectorRef) {
    facade.allDriver$.subscribe(drivers => {
      this.drivers = drivers;
      changeDetectorRef.markForCheck();
    });
  }

  transform(driverId: string, ...args: unknown[]): IDriver | undefined {

    if (driverId && driverId !== this.previousCode && this.drivers?.length) {
      this.previousCode = driverId;
      this.driver = this.drivers.find(d => d.driverId === driverId);
    }
    return this.driver;
  }

}
