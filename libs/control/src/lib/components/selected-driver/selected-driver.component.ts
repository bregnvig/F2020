import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { IRace, SelectedDriverValue } from '@f2020/data';
import { untilDestroyed } from '@ngneat/until-destroy';
import { AbstractControlComponent } from '../../abstract-control-component';

import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'f2020-selected-driver',
  templateUrl: './selected-driver.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectedDriverComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SelectedDriverComponent),
      multi: true,
    },
  ],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule
],
})
export class SelectedDriverComponent extends AbstractControlComponent<SelectedDriverValue> implements OnInit {

  @Input({ required: true }) race: IRace;
  fg: FormGroup;
  possiblePositions: number[];

  constructor(private fb: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    this.possiblePositions = Array.from({ length: this.race.drivers.length }, (_, k) => k + 1);
    this.fg = this.fb.group({
      grid: [null, [Validators.required, Validators.min(1), Validators.max(this.race.drivers.length)]],
      finish: [null, [Validators.required, Validators.min(1), Validators.max(this.race.drivers.length)]],
    });
    this.fg.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe(value => this.propagateChange(value));
  }

  writeValue(value: SelectedDriverValue): void {
    if (value) {
      this.fg.patchValue(value, { emitEvent: false });
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

  validate(): ValidationErrors | null {
    return this.fg.valid ? null : { required: true };
  }

}
