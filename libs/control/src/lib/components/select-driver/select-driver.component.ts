import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { ITeam } from '@f2020/data';
import { untilDestroyed } from '@ngneat/until-destroy';
import { AbstractControlComponent } from '../../abstract-control-component';
import { DriverNamePipe } from '@f2020/driver';
import { MatOptionModule } from '@angular/material/core';
import { NgIf, NgFor } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
    selector: 'f2020-select-driver',
    templateUrl: './select-driver.component.html',
    styleUrls: ['./select-driver.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SelectDriverComponent),
            multi: true,
        },
    ],
    standalone: true,
    imports: [
        MatFormFieldModule,
        MatSelectModule,
        ReactiveFormsModule,
        NgIf,
        NgFor,
        MatOptionModule,
        DriverNamePipe,
    ],
})
export class SelectDriverComponent extends AbstractControlComponent<string> implements OnInit {

  @Input() driverIds: string[];
  @Input() teams: ITeam[];
  @Input() label: string;
  @Input() error: string;
  selectControl = new FormControl();
  allTeamAndDrivers: [string, string[]][];

  ngOnInit(): void {
    if (this.teams) {
      this.allTeamAndDrivers = Array.from(this.driverIds.reduce((acc, driverId) => {
        const team = this.teams.find(t => t.drivers.includes(driverId));
        if (!acc.has(team.name)) {
          acc.set(team.name, []);
        }
        acc.get(team.name).push(driverId);
        return acc;
      }, new Map<string, string[]>()).entries());
    }
    this.selectControl.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe(driverId => this.propagateChange(driverId));
  }

  markAllTouched(): void {
    this.selectControl.markAsTouched();
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.selectControl.disable() : this.selectControl.enable();
  }

  writeValue(value: string): void {
    setTimeout(() => {
      if (value) {
        this.selectControl.patchValue(value, { emitEvent: false });
      } else {
        this.selectControl.reset({}, { emitEvent: false });
      }
    });
  }
}
