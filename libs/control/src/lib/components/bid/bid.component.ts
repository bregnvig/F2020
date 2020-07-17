import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validators } from '@angular/forms';
import { Bid, IRace, ITeam } from '@f2020/data';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime } from 'rxjs/operators';
import { AbstractControlComponent } from '../../abstract-control-component';

@UntilDestroy()
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
  ]
})
export class BidComponent extends AbstractControlComponent implements OnInit {

  @Input() race: IRace;
  @Input() team: ITeam;
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
      qualify: [{value: null, disabled: this.isResult}, Validators.required],
      fastestDriver: [{value: null, disabled: this.isResult}, Validators.required],
      podium: [{value: null, disabled: this.isResult}, Validators.required],
      selectedDriver: [{value: null, disabled: this.isResult}],
      selectedTeam: [{value: null, disabled: this.isResult || !this.race.selectedTeam}],
      firstCrash: [{value: null, disabled: this.isResult}, Validators.required],
      polePositionTime: [{value: null, disabled: this.isResult}, Validators.required],
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
        polePositionTime: null,
        ...value
      }, {emitEvent: false});
    } else {
      this.fg.reset({}, {emitEvent: false});
    }
  }

  markAllTouched(): void {
    this.markAllTouched();
  }

  validate(control: AbstractControl): ValidationErrors | null {
    return this.fg.valid ? null : { required: true };
  }

  setDisabledState(isDisabled: boolean) {
    isDisabled ? this.fg.disable() : this.fg.enable();
  }

}
