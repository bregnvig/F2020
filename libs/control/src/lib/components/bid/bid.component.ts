import { Component, computed, forwardRef, inject, input } from '@angular/core';
import { FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Bid, IRace, ITeam, SelectedDriverValue, SelectedTeamValue } from '@f2020/data';
import { debounceTime } from 'rxjs/operators';
import { AbstractControlComponent } from '../../abstract-control-component';
import { DriverNamePipe } from '@f2020/driver';
import { CardPageComponent, PolePositionTimePipe, TeamNamePipe } from '@f2020/shared';
import { PolePositionTimeComponent } from '../pole-position-time/pole-position-time.component';
import { SelectTeamsComponent } from '../select-teams/select-teams.component';
import { SelectedTeamComponent } from '../selected-team/selected-team.component';
import { SelectedDriverComponent } from '../selected-driver/selected-driver.component';
import { SelectDriversComponent } from '../select-drivers/select-drivers.component';
import { DriverCodesComponent } from '../driver-codes/driver-codes.component';

import { MatExpansionModule } from '@angular/material/expansion';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'f2020-bid',
  templateUrl: './bid.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BidComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => BidComponent),
      multi: true,
    },
  ],
  imports: [CardPageComponent, ReactiveFormsModule, MatExpansionModule, DriverCodesComponent, SelectDriversComponent, SelectedDriverComponent, SelectedTeamComponent, SelectTeamsComponent, PolePositionTimeComponent, PolePositionTimePipe, TeamNamePipe, DriverNamePipe],
})
export class BidComponent extends AbstractControlComponent<Bid> {

  #fb = inject(FormBuilder);

  race = input.required<IRace>();
  teams = input.required<ITeam[]>();
  type = input.required<'bid' | 'result' | 'interim'>();
  isInterim = computed(() => this.type() === 'interim');
  isResult = computed(() => this.type() === 'result');
  notBid = computed(() => this.type() !== 'bid');

  fg = this.#fb.group({
    qualify: this.#fb.control<string[]>(null, Validators.required),
    fastestDriver: this.#fb.control<string[]>(null, Validators.required),
    podium: this.#fb.control<string[]>(null, Validators.required),
    selectedDriver: this.#fb.control<SelectedDriverValue>(null),
    selectedTeam: this.#fb.control<SelectedTeamValue>({ value: null, disabled: true }),
    slowestPitStop: this.#fb.control<string[]>(null, Validators.required),
    firstCrash: this.#fb.control<string[]>(null, Validators.required),
    polePositionTime: this.#fb.control<number>(null, Validators.required),
  });

  fastestLapLabelFn = () => 'Hurtigste kører';
  firstCrashLabelFn = () => 'Første udgået';
  podiumLabelFn = (index: number) => `${index}. plads`;

  constructor() {
    super();
    this.fg.valueChanges.pipe(
      debounceTime(300),
      takeUntilDestroyed(),
    ).subscribe(value => this.propagateChange(value));
  }

  writeValue(value: Bid): void {
    if (value) {
      this.fg.reset({
        qualify: null,
        fastestDriver: null,
        podium: null,
        selectedDriver: null,
        selectedTeam: null,
        firstCrash: null,
        slowestPitStop: null,
        polePositionTime: null,
        ...value,
      }, { emitEvent: false });
    } else {
      this.fg.reset({}, { emitEvent: false });
    }
  }

  markAllTouched(): void {
    this.fg.markAllAsTouched();
  }

  validate(): ValidationErrors | null {
    return this.fg.valid ? null : { required: true };
  }

  setDisabledState(isDisabled: boolean) {
    isDisabled ? this.fg.disable() : this.fg.enable();
    this.disableByType();
  }

  private disableByType() {
    this.race().selectedTeam && this.fg.controls.selectedTeam.enable();
    if (this.isInterim()) {
      ['slowestPitStop', 'firstCrash', 'fastestDriver', 'podium'].forEach(name => this.fg.controls[name].disable());
    }
  }

}
