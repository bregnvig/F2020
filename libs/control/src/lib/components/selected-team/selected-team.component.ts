import { Component, computed, forwardRef, inject, input } from '@angular/core';
import { FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ITeam, SelectedTeamValue } from '@f2020/data';
import { AbstractControlComponent } from '../../abstract-control-component';
import { SelectDriverComponent } from '../select-driver/select-driver.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'f2020-selected-team',
  template: `
    <div [formGroup]="fg">
      <f2020-select-driver [driverIds]="driverIds()" label="Kvalifikation"
                           formControlName="qualify">
      </f2020-select-driver>
      <f2020-select-driver [driverIds]="driverIds()" label="Resultat"
                           formControlName="result">
      </f2020-select-driver>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectedTeamComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SelectedTeamComponent),
      multi: true,
    },
  ],
  imports: [ReactiveFormsModule, SelectDriverComponent],
})
export class SelectedTeamComponent extends AbstractControlComponent<SelectedTeamValue> {

  #fb = inject(FormBuilder);

  readonly team = input.required<ITeam>();
  driverIds = computed(() => this.team().drivers);

  fg = this.#fb.group({
    qualify: this.#fb.control<string>(null, Validators.required),
    result: this.#fb.control<string>(null, Validators.required),
  });

  constructor() {
    super();
    this.setupStandardControl(this.fg);
    this.fg.valueChanges.pipe(
      takeUntilDestroyed(),
    ).subscribe(value => this.propagateChange(value));
  }

  writeValue(value: SelectedTeamValue): void {
    this.fg.reset(value || {}, { emitEvent: false });
  }

  validate(): ValidationErrors | null {
    return this.fg && this.fg.invalid ? { required: true } : null;
  }
}
