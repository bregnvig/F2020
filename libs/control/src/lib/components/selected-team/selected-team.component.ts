import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { ITeam, SelectedTeamValue } from '@f2020/data';
import { AbstractControlComponent } from '../../abstract-control-component';
import { SelectDriverComponent } from '../select-driver/select-driver.component';

@Component({
    selector: 'f2020-selected-team',
    templateUrl: './selected-team.component.html',
    styleUrls: ['./selected-team.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SelectedTeamComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => SelectedTeamComponent),
            multi: true
        }
    ],
    standalone: true,
    imports: [ReactiveFormsModule, SelectDriverComponent],
})
export class SelectedTeamComponent extends AbstractControlComponent<SelectedTeamValue> implements OnInit {

  @Input() team: ITeam;
  driverIds: string[];
  fg: FormGroup;

  constructor(private fb: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    this.driverIds = this.team.drivers;
    this.fg = this.fb.group({
      qualify: [null, Validators.required],
      result: [null, Validators.required],
    });
    this.fg.valueChanges.subscribe(value => this.propagateChange(value));
  }

  writeValue(value: SelectedTeamValue): void {
    this.fg.patchValue(value || {});
  }

  markAllTouched(): void {
    this.fg.markAllAsTouched();
  }

  validate(): ValidationErrors | null {
    return this.fg && this.fg.invalid ? { required: true } : null;
  }
}
