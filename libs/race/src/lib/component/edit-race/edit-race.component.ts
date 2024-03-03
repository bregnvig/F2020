import { Component, effect, Signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RaceStore, TeamService } from '@f2020/api';
import { IRace, ITeam } from '@f2020/data';
import { UntilDestroy } from '@ngneat/until-destroy';
import { combineLatest, map, Observable } from 'rxjs';
import { CardPageComponent, FlagURLPipe, icon } from '@f2020/shared';
import { MatButtonModule } from '@angular/material/button';
import { SelectDriverComponent } from '@f2020/control';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { AsyncPipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@UntilDestroy()
@Component({
  selector: 'f2020-edit-race',
  templateUrl: './edit-race.component.html',
  standalone: true,
  imports: [
    CardPageComponent,
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    NgxMatTimepickerModule,
    MatIconModule,
    SelectDriverComponent,
    MatButtonModule,
    AsyncPipe,
    FlagURLPipe,
    FontAwesomeModule
],
})
export class EditRaceComponent {

  clockIcon = icon.farClock;
  race: Signal<IRace>;
  selectedDriver$: Observable<{ teams: ITeam[], drivers: string[]; }>;
  fg = this.fb.group({
    close: this.fb.control<string>(null),
    selectedDriver: this.fb.control<string>(null),
  });

  constructor(
    private fb: FormBuilder,
    private store: RaceStore,
    private snackBar: MatSnackBar,
    teamService: TeamService) {
    this.race = store.race;

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
