import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, input } from '@angular/core';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { SeasonStore } from '@f2020/api';
import { ITeam } from '@f2020/data';
import { TeamLogoComponent } from '@f2020/shared';
import { AbstractControlComponent } from '../../abstract-control-component';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'f2020-select-team',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field class="w-full">
      <mat-label>{{ label() }}</mat-label>
      <mat-select [formControl]="selectControl">
        @for (team of teams(); track team) {
          <mat-option [value]="team.constructorId">
            <span class="flex flex-row items-center gap-2">
              @if (seasonId(); as seasonId) {
                <sha-team-logo [seasonId]="seasonId" [name]="team.name" [size]="24"/>
              }
              {{ team.name }}
            </span>
          </mat-option>
        }
      </mat-select>
      <mat-hint align="end">{{ error() }}</mat-hint>
    </mat-form-field>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectTeamComponent),
      multi: true,
    },
  ],
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatOptionModule,
    TeamLogoComponent,
  ],
})
export class SelectTeamComponent extends AbstractControlComponent<string> {

  readonly #season = inject(SeasonStore).season;

  readonly teams = input.required<ITeam[]>();
  readonly label = input.required<string>();
  readonly error = input<string>(undefined);
  selectControl = new FormControl<string>('', { nonNullable: true });
  protected readonly seasonId = computed(() => this.#season()?.id);

  constructor() {
    super();
    this.setupStandardControl(this.selectControl);
    this.selectControl.valueChanges.pipe(
      takeUntilDestroyed(),
    ).subscribe(teamId => this.propagateChange(teamId));
  }

  writeValue(value: string): void {
    this.selectControl.reset(value, { emitEvent: false });
  }
}
