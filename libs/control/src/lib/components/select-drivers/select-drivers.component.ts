import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validators } from '@angular/forms';
import { IRace, ITeam } from '@f2020/data';
import { AbstractControlComponent } from '../../abstract-control-component';
import { DriverNamePipe } from '@f2020/driver';

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
  templateUrl: './select-drivers.component.html',
  styleUrls: ['./select-drivers.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectDriversComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SelectDriversComponent),
      multi: true
    }
  ],
})
export class SelectDriversComponent extends AbstractControlComponent implements OnInit {

  @Input() race: IRace;
  @Input() teams: ITeam[];
  @Input() noOfDrivers: number;

  fg: FormGroup;
  drivers: FormArray;

  @Input() labelFn: LabelFn = (index: number) => `Vælg ${index}. kører`;

  constructor(private fb: FormBuilder, private driverName: DriverNamePipe) {
    super();
  }

  ngOnInit(): void {
    this.drivers = this.fb.array(Array.from({ length: this.noOfDrivers }, () => [null]), uniqueDrivers),
      this.fg = this.fb.group({
        drivers: this.drivers,
      });
    this.drivers.valueChanges.pipe(
      this.takeUntilDestroyed(),
    ).subscribe(value => this.propagateChange(value));
  }

  writeValue(value: string[] | string): void {
    if (value) {
      this.drivers.patchValue(Array.isArray(value) ? value : [value], { emitEvent: false });
    } else {
      this.fg.reset({}, { emitEvent: false });
    }
  }

  markAllTouched(): void {
    this.fg.markAllAsTouched();
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.fg.disable() : this.fg.enable();
  }

  validate(control: AbstractControl): ValidationErrors | null {
    return this.drivers?.valid ? null : { required: true };
  }

  errorMessage(index: number): string {
    return this.drivers.errors && this.drivers.errors[index] ? (this.driverName.transform(this.drivers.at(index).value)) + ' må ikke vælges flere gange' : '';
  }

}
