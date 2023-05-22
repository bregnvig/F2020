import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ITeam } from '@f2020/data';
import { untilDestroyed } from '@ngneat/until-destroy';
import { AbstractControlComponent } from '../../abstract-control-component';

@Component({
  selector: 'f2020-select-team',
  templateUrl: './select-team.component.html',
  styleUrls: ['./select-team.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectTeamComponent),
      multi: true,
    },
  ],
})
export class SelectTeamComponent extends AbstractControlComponent<string> implements OnInit {

  @Input() teams: ITeam[];
  @Input() label: string;
  @Input() error: string;
  selectControl = new FormControl();

  ngOnInit(): void {
    this.selectControl.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe(teamId => this.propagateChange(teamId));
  }

  markAllTouched(): void {
    this.selectControl.markAsTouched();
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.selectControl.disable() : this.selectControl.enable();
  }

  writeValue(value: string): void {
    this.selectControl.reset(value, { emitEvent: false });
  }
}
