import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { AbstractControlComponent } from '../abstract-control-component';
import { FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'f2020-select-driver',
  templateUrl: './select-driver.component.html',
  styleUrls: ['./select-driver.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectDriverComponent),
      multi: true,
    },
  ],
})
export class SelectDriverComponent extends AbstractControlComponent implements OnInit {

  @Input() driverIds: string[];
  selectControl = new FormControl();

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.selectControl.valueChanges.pipe(
      this.takeUntilDestroyed(),
    ).subscribe(driverId => this.propagateChange(driverId));
  }

  markAllTouched(): void {
    this.selectControl.markAsTouched();
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.selectControl.disable() : this.selectControl.enable();
  }

  writeValue(value: string): void {
    if (value) {
      this.selectControl.patchValue(value, {emitEvent: false});
    } else {
      this.selectControl.reset();
    }
  }
}
