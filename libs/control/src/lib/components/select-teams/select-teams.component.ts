import { ChangeDetectionStrategy, Component, forwardRef, input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { ITeam } from '@f2020/data';
import { TeamNamePipe } from '@f2020/shared';
import { untilDestroyed } from '@ngneat/until-destroy';
import { AbstractControlComponent } from '../../abstract-control-component';
import { SelectTeamComponent } from '../select-team/select-team.component';


type LabelFn = (index: number) => string;

const uniqueTeams = (driverArray: FormArray): null | string[] => {
  const value: string[] = (driverArray.value || []);
  const constructorIds: string[] = value.filter((constructorId: string) => !!constructorId);
  const count: { [key: string]: number; } = constructorIds.reduce((acc, constructorId) => {
    if (!acc[constructorId]) {
      acc[constructorId] = 0;
    }
    acc[constructorId] += 1;
    return acc;
  }, {});
  const errors: string[] = value.map((constructorId: string) => constructorId && count[constructorId] > 1 ? constructorId : null);
  return errors.some(error => !!error) ? errors : null;
};

@Component({
  selector: 'f2020-select-teams',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [formGroup]="fg" class="flex flex-col">
      @for (_ of teamsArray.controls; track $index) {
        <ng-container formArrayName="teams">
          <f2020-select-team
            [teams]="teams()"
            [label]="labelFn()($index + 1)"
            [error]="errorMessage($index)"
            [formControlName]="$index">
          </f2020-select-team>
        </ng-container>
      }
    </div>
  `,
  providers: [
    TeamNamePipe,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectTeamsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SelectTeamsComponent),
      multi: true,
    },
  ],
  imports: [
    ReactiveFormsModule,
    SelectTeamComponent,
  ],
})
export class SelectTeamsComponent extends AbstractControlComponent<string[]> implements OnInit {

  readonly teams = input.required<ITeam[]>();
  readonly noOfTeams = input.required<number>();
  readonly labelFn = input<LabelFn>((index: number) => `Vælg ${index}. hold`);

  fg: FormGroup;
  teamsArray: FormArray<FormControl<string>>;

  constructor(private fb: FormBuilder, private teamName: TeamNamePipe) {
    super();
  }

  ngOnInit(): void {
    this.teamsArray = this.fb.array(Array.from({ length: this.noOfTeams() }, () => [null]), uniqueTeams);
    this.fg = this.fb.group({
      teams: this.teamsArray,
    });
    this.setupStandardControl(this.fg);
    this.teamsArray.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe(value => this.propagateChange(value));
  }

  writeValue(value: string[] | string): void {
    if (value) {
      this.teamsArray.reset(Array.isArray(value) ? value : [value], { emitEvent: false });
    } else {
      this.fg.reset({}, { emitEvent: false });
    }
  }

  validate(): ValidationErrors | null {
    return this.teamsArray?.valid ? null : { required: true };
  }

  errorMessage(index: number): string {
    return this.teamsArray.errors && this.teamsArray.errors[index] ? (this.teamName.transform(this.teamsArray.at(index).value)) + ' må ikke vælges flere gange' : '';
  }

}
