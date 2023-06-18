import { Component, forwardRef, OnInit } from '@angular/core';
import { FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { mapper } from '@f2020/data';
import { untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, map } from 'rxjs/operators';
import { AbstractControlComponent } from '../../abstract-control-component';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

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
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
})
export class PolePositionTimeComponent extends AbstractControlComponent<number> implements OnInit {

  fg = this.fb.group({
    minutes: this.fb.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(2)]),
    seconds: this.fb.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(59)]),
    milliseconds: this.fb.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(999)]),
  });

  constructor(private fb: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    this.fg.valueChanges.pipe(
      untilDestroyed(this),
      debounceTime(100),
      map(value => mapper.polePosition.join(value)),
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
      this.fg.patchValue(mapper.polePosition.split(value), { emitEvent: false });
    } else {
      this.fg.reset({}, { emitEvent: false });
    }
  }

  validate(): ValidationErrors | null {
    return this.fg.valid ? null : { required: true };
  }

}
