import { ChangeDetectionStrategy, Component, forwardRef, inject, input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { IRace, ITeam } from '@f2020/data';
import { DriverNamePipe } from '@f2020/driver';
import { ensureArray } from '@f2020/tools';
import { untilDestroyed } from '@ngneat/until-destroy';
import { AbstractControlComponent } from '../../abstract-control-component';
import { SelectDriverComponent } from '../select-driver/select-driver.component';

type LabelFn = (index: number) => string;

const uniqueDrivers = (driverArray: FormArray): null | string[] => {
  const value: string[] = (driverArray.value || []);
  const driverIds: string[] = value.filter((driverId: string) => !!driverId);
  const count: { [key: string]: number; } = driverIds.reduce((acc, driverId) => {
    if (!acc[driverId]) {
      acc[driverId] = 0;
    }
    acc[driverId] += 1;
    return acc;
  }, {});
  const errors: string[] = value.map((driverId: string) => driverId && count[driverId] > 1 ? driverId : null);
  return errors.some(error => !!error) ? errors : null;
};

@Component({
  selector: 'f2020-select-drivers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [formGroup]="fg" class="flex flex-col">
      @for (_ of drivers.controls; track $index) {
        <ng-container formArrayName="drivers">
          <f2020-select-driver
            [driverIds]="race()?.drivers"
            [teams]="teams()"
            [label]="labelFn()($index + 1)"
            [error]="errorMessage($index)"
            [formControlName]="$index">
          </f2020-select-driver>
        </ng-container>
      }
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectDriversComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SelectDriversComponent),
      multi: true,
    },
    DriverNamePipe,
  ],
  imports: [
    ReactiveFormsModule,
    SelectDriverComponent,
  ],
})
export class SelectDriversComponent extends AbstractControlComponent<string[]> implements OnInit {

  #fb = inject(FormBuilder);
  #driverName = inject(DriverNamePipe);

  readonly race = input.required<IRace>();
  readonly teams = input.required<ITeam[]>();
  readonly noOfDrivers = input.required<number>();
  readonly labelFn = input<LabelFn>((index: number) => `Vælg ${index}. kører`);

  fg = this.#fb.group({
    drivers: this.#fb.array([]),
  });

  drivers: FormArray;

  ngOnInit(): void {

    this.setupStandardControl(this.fg);
    this.drivers = this.#fb.array(Array.from({ length: this.noOfDrivers() }, () => this.#fb.control<string>(null)), [uniqueDrivers]);
    this.fg.setControl('drivers', this.drivers);

    this.drivers.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe(value => this.propagateChange(value));
  }

  writeValue(value: string[] | string): void {
    if (value) {
      this.drivers.reset(ensureArray(value), { emitEvent: false });
    } else {
      this.fg.reset({}, { emitEvent: false });
    }
  }

  validate(): ValidationErrors | null {
    return this.drivers?.valid ? null : { required: true };
  }

  errorMessage(index: number): string {
    return this.drivers.errors && this.drivers.errors[index] ? (this.#driverName.transform(this.drivers.at(index).value)) + ' må ikke vælges flere gange' : '';
  }

}
