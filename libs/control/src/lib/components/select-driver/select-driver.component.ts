import { Component, forwardRef, input, OnInit } from '@angular/core';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { ITeam } from '@f2020/data';
import { DriverPipe } from '@f2020/driver';
import { untilDestroyed } from '@ngneat/until-destroy';
import { AbstractControlComponent } from '../../abstract-control-component';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'f2020-select-driver',
  templateUrl: './select-driver.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectDriverComponent),
      multi: true,
    },
  ],
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatOptionModule,
    DriverPipe,
  ],
})
export class SelectDriverComponent extends AbstractControlComponent<string> implements OnInit {

  readonly driverIds = input.required<string[]>();
  readonly teams = input<ITeam[]>(undefined);
  readonly label = input.required<string>();
  readonly error = input<string>();
  selectControl = new FormControl<string>(null);
  allTeamAndDrivers: [string, string[]][];

  ngOnInit(): void {
    this.setupStandardControl(this.selectControl);
    if (this.teams()) {
      this.allTeamAndDrivers = Array.from(this.driverIds().reduce((acc, driverId) => {
        const team = this.teams().find(t => t.drivers.includes(driverId));
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

  writeValue(value: string | null): void {
    this.selectControl.patchValue(value, { emitEvent: false });
  }
}
