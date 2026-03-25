import { ChangeDetectionStrategy, Component, forwardRef, input, OnInit } from '@angular/core';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { ITeam } from '@f2020/data';
import { DriverPipe } from '@f2020/driver';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControlComponent } from '../../abstract-control-component';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'f2020-select-driver',
  templateUrl: './select-driver.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    NgOptimizedImage,
  ],
})
export class SelectDriverComponent extends AbstractControlComponent<string> implements OnInit {

  readonly driverIds = input.required<string[]>();
  readonly teams = input<ITeam[]>(undefined);
  readonly label = input.required<string>();
  readonly error = input<string>();
  selectControl = new FormControl<string>(null);
  allTeamAndDrivers: [string, string[]][];

  constructor() {
    super();
    this.setupStandardControl(this.selectControl);
    this.selectControl.valueChanges.pipe(
      takeUntilDestroyed(),
    ).subscribe(driverId => this.propagateChange(driverId));
  }

  ngOnInit(): void {
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
  }

  writeValue(value: string | null): void {
    this.selectControl.patchValue(value, { emitEvent: false });
  }
}
