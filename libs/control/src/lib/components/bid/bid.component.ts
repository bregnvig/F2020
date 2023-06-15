import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { Bid, IRace, ITeam } from '@f2020/data';
import { untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime } from 'rxjs/operators';
import { AbstractControlComponent } from '../../abstract-control-component';
import { DriverNamePipe } from '@f2020/driver';
import { TeamNamePipe } from '@f2020/shared';
import { PolePositionTimePipe } from '@f2020/shared';
import { PolePositionTimeComponent } from '../pole-position-time/pole-position-time.component';
import { SelectTeamsComponent } from '../select-teams/select-teams.component';
import { SelectedTeamComponent } from '../selected-team/selected-team.component';
import { SelectedDriverComponent } from '../selected-driver/selected-driver.component';
import { SelectDriversComponent } from '../select-drivers/select-drivers.component';
import { DriverCodesComponent } from '../driver-codes/driver-codes.component';
import { NgIf, NgFor } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { CardPageComponent } from '@f2020/shared';

@Component({
  selector: 'f2020-bid',
  templateUrl: './bid.component.html',
  styleUrls: ['./bid.component.scss'],
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
  standalone: true,
  imports: [CardPageComponent, ReactiveFormsModule, MatExpansionModule, NgIf, DriverCodesComponent, SelectDriversComponent, SelectedDriverComponent, SelectedTeamComponent, NgFor, SelectTeamsComponent, PolePositionTimeComponent, PolePositionTimePipe, TeamNamePipe, DriverNamePipe]
})
export class BidComponent extends AbstractControlComponent<Bid> implements OnInit {

  @Input() race: IRace;
  @Input() teams: ITeam[];
  @Input() isResult = false;
  fg: FormGroup;

  fastestLapLabelFn = () => 'Hurtigste kører';
  firstCrashLabelFn = () => 'Første udgået';
  podiumLabelFn = (index: number) => `${index}. plads`;

  constructor(
    private fb: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    this.fg = this.fb.group({
      qualify: [{ value: null, disabled: this.isResult }, Validators.required],
      fastestDriver: [{ value: null, disabled: this.isResult }, Validators.required],
      podium: [{ value: null, disabled: this.isResult }, Validators.required],
      selectedDriver: [{ value: null, disabled: this.isResult }],
      selectedTeam: [{ value: null, disabled: this.isResult || !this.race.selectedTeam }],
      slowestPitStop: [{ value: null, disabled: this.isResult }, Validators.required],
      firstCrash: [{ value: null, disabled: this.isResult }, Validators.required],
      polePositionTime: [{ value: null, disabled: this.isResult }, Validators.required],
    });
    this.fg.valueChanges.pipe(
      debounceTime(300),
      untilDestroyed(this),
    ).subscribe(value => this.propagateChange(value));
  }

  writeValue(value: Bid): void {
    if (value) {
      this.fg.patchValue({
        qualify: null,
        fastestDriver: null,
        podium: null,
        selectedDriver: null,
        selectedTeam: null,
        firstCrash: null,
        slowestPitStop: null,
        polePositionTime: null,
        ...value
      }, { emitEvent: false });
    } else {
      this.fg.reset({}, { emitEvent: false });
    }
  }

  markAllTouched(): void {
    this.markAllTouched();
  }

  validate(): ValidationErrors | null {
    return this.fg.valid ? null : { required: true };
  }

  setDisabledState(isDisabled: boolean) {
    isDisabled ? this.fg.disable() : this.fg.enable();
  }

}
