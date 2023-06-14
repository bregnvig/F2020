import { ChangeDetectorRef, Pipe, PipeTransform } from '@angular/core';
import { DriversFacade } from '../+state/drivers.facade';
import { IDriver } from '@f2020/data';

@Pipe({
    name: 'driverName',
    pure: false,
    standalone: true,
})
export class DriverNamePipe implements PipeTransform {

  private previousCode: string;
  private name: string;
  private drivers: IDriver[];

  constructor(facade: DriversFacade, changeDetectorRef: ChangeDetectorRef) {
    facade.allDriver$.subscribe(drivers => {
      this.drivers = drivers;
      changeDetectorRef.markForCheck();
    });
  }

  transform(driverId: string, ...args: unknown[]): unknown {

    if (driverId && driverId !== this.previousCode && this.drivers?.length) {
      this.previousCode = driverId;
      this.name = this.drivers.find(d => d.driverId === driverId)?.name ?? driverId;
    }
    return this.name ?? driverId;
  }

}
