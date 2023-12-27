import { ChangeDetectorRef, effect, Pipe, PipeTransform } from '@angular/core';
import { IDriver } from '@f2020/data';
import { DriversStore } from '../+state';

@Pipe({
  name: 'driverName',
  pure: false,
  standalone: true,
})
export class DriverNamePipe implements PipeTransform {

  private previousCode: string;
  private name: string;
  private drivers: IDriver[];

  constructor(facade: DriversStore, changeDetectorRef: ChangeDetectorRef) {
    effect(() => {
      this.drivers = facade.drivers();
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
