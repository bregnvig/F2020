import { Component, forwardRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validators } from '@angular/forms';
import { mapper } from '@f2020/data';
import { debounceTime, map } from 'rxjs/operators';
import { AbstractControlComponent } from '../../abstract-control-component';

@Component({
  selector: 'f2020-pole-position-time',
  templateUrl: './pole-position-time.component.html',
  styleUrls: ['./pole-position-time.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PolePositionTimeComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PolePositionTimeComponent),
      multi: true,
    },
  ],
})
export class PolePositionTimeComponent extends AbstractControlComponent implements OnInit {

  fg: FormGroup;

  constructor(private fb: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    this.fg = this.fb.group({
      minutes: [null, [Validators.required, Validators.min(0), Validators.max(2)]],
      seconds: [null, [Validators.required, Validators.min(0), Validators.max(59)]],
      milliseconds: [null, [Validators.required, Validators.min(0), Validators.max(999)]],
    });
    this.fg.valueChanges.pipe(
      this.takeUntilDestroyed(),
      debounceTime(100),
      map(value => mapper.polePostion.join(value))
    ).subscribe(millis => this.propagateChange(millis));
  }

  markAllTouched(): void {
    this.fg.markAllAsTouched();
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.fg.disable() : this.fg.enable();
  }

  writeValue(value: number): void {
    if (value !== null) {
      this.fg.patchValue(mapper.polePostion.split(value), { emitEvent: false });
    } else {
      this.fg.reset({}, { emitEvent: false });
    }
  }

  validate(): ValidationErrors | null {
    return this.fg.valid ? null : { required: true };
  }

}
