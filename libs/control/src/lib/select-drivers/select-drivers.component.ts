import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validators } from '@angular/forms';
import { IRace } from '@f2020/data';
import { AbstractControlComponent } from '../abstract-control-component';

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
      useClass: SelectDriversComponent,
      multi: true
    }
  ],
})
export class SelectDriversComponent extends AbstractControlComponent implements OnInit {

  @Input() race: IRace;
  @Input() noOfDrivers: number;
  fg: FormGroup;
  drivers: FormArray;

  constructor(private fb: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    this.drivers = this.fb.array(Array.from({ length: this.noOfDrivers }, () => [null, Validators.required])),
      this.fg = this.fb.group({
        drivers: this.drivers,
      });
    this.drivers.valueChanges.pipe(
      this.takeUntilDestroyed(),
    ).subscribe(value => this.propagateChange(value));
  }

  writeValue(value: string[] | string): void {
    if (value) {
      this.drivers.patchValue(Array.isArray(value) ? value : [value], {emitEvent: false});
    } else {
      this.fg.reset();
    }
  }

  markAllTouched(): void {
    this.fg.markAllAsTouched();
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.fg.disable() : this.fg.enable();
  }

  validate(control: AbstractControl): ValidationErrors | null {
    return (control?.value ?? [] as Array<string>).every(driverId => !!driverId) ? null : { required: true };
  }


}
