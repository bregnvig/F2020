import { NgxMatTimepickerComponent, NgxMatTimepickerDirective } from '@alexfriesen/ngx-mat-timepicker';
import { AsyncPipe } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RaceStore, TeamService } from '@f2020/api';
import { SelectDriverComponent } from '@f2020/control';
import { ITeam } from '@f2020/data';
import { CardPageComponent, FlagURLPipe, icon } from '@f2020/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UntilDestroy } from '@ngneat/until-destroy';
import { combineLatest, map, Observable } from 'rxjs';

@UntilDestroy()
@Component({
    selector: 'f2020-edit-race',
    templateUrl: './edit-race.component.html',
    imports: [
        CardPageComponent,
        MatCardModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        SelectDriverComponent,
        MatButtonModule,
        AsyncPipe,
        FlagURLPipe,
        FontAwesomeModule,
        NgxMatTimepickerComponent,
        NgxMatTimepickerDirective,
    ]
})
export class EditRaceComponent {

  clockIcon = icon.farClock;

  private store = inject(RaceStore);

  race = this.store.race;
  selectedDriver$: Observable<{ teams: ITeam[], drivers: string[]; }>;
  fg = this.fb.group({
    close: this.fb.control<string>(null),
    selectedDriver: this.fb.control<string>(null),
  });

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    teamService: TeamService) {

    this.selectedDriver$ = combineLatest({
      teams: teamService.teams$,
      drivers: teamService.teams$.pipe(
        map(teams => teams.flatMap(team => team.drivers)),
      ),
    });
    effect(() => {
      this.race() && this.fg.reset({
        selectedDriver: this.race().selectedDriver,
        close: this.race().close.toFormat('HH:mm'),
      });
    });
  }

  save() {
    const race = { ...this.race() };
    const close = race.close.set({
      hour: parseInt(this.fg.value.close.substring(0, 2)),
      minute: parseInt(this.fg.value.close.substring(3)),
    });
    const isChanged = race.selectedDriver !== this.fg.value.selectedDriver || +race.close !== +close;
    if (isChanged) {
      this.store.update({
        ...race,
        selectedDriver: this.fg.value.selectedDriver,
        close,
      }).then(() => window.history.back());
    }
  }
}
