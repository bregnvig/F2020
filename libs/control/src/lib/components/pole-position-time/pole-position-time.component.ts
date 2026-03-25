import { ChangeDetectionStrategy, Component, forwardRef, inject } from '@angular/core';
import { FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { mapper } from '@f2020/data';
import { debounceTime, map } from 'rxjs/operators';
import { AbstractControlComponent } from '../../abstract-control-component';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'f2020-pole-position-time',
  templateUrl: './pole-position-time.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
})
export class PolePositionTimeComponent extends AbstractControlComponent<number> {

  #fb = inject(FormBuilder);
  fg = this.#fb.group({
    minutes: this.#fb.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(2)]),
    seconds: this.#fb.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(59)]),
    milliseconds: this.#fb.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(999)]),
  });

  constructor() {
    super();
    this.setupStandardControl(this.fg);
    this.fg.valueChanges.pipe(
      debounceTime(100),
      map(value => mapper.polePosition.join(value)),
      takeUntilDestroyed(),
    ).subscribe(millis => this.propagateChange(millis || null));

  }

  writeValue(value: number): void {
    this.fg.reset(value ? mapper.polePosition.split(value) : {}, { emitEvent: false });
  }

  validate(): ValidationErrors | null {
    return this.fg.valid ? null : { required: true };
  }

}
