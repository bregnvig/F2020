import { ChangeDetectorRef, effect, inject, Pipe, PipeTransform } from '@angular/core';
import { IDriver } from '@f2020/data';
import { DriversStore } from '@f2020/api';

@Pipe({
  name: 'driver',
  pure: false,
  standalone: true,
})
export class DriverPipe implements PipeTransform {

  private previousCode: string;
  private driver: IDriver;
  private drivers: IDriver[];

  constructor(changeDetectorRef: ChangeDetectorRef) {
    const store = inject(DriversStore);
    effect(() => {
      this.drivers = store.drivers();
      changeDetectorRef.markForCheck();
    });
  }

  transform(driverId: string): IDriver | undefined {

    if (driverId && driverId !== this.previousCode && this.drivers?.length) {
      this.previousCode = driverId;
      this.driver = this.drivers.find(d => d.driverId === driverId);
    }
    return this.driver;
  }

}
