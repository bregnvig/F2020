import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DriverPipe } from '@f2020/driver';

@Component({
  selector: 'f2020-driver-codes',
  template: `
     <ng-container *ngFor="let driverId of driverIds; last as last">{{(driverId | driver)?.code}}<ng-container *ngIf="!last">, </ng-container></ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgFor, NgIf, DriverPipe]
})
export class DriverCodesComponent {

  #driverIds: string[];

  @Input() set driverIds(value: string[]) {
    this.#driverIds = (value || []).filter(id => !!id);
  }

  get driverIds() {
    return this.#driverIds;
  }

}
