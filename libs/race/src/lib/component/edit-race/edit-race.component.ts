import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RacesActions, RacesFacade, TeamService } from '@f2020/api';
import { IRace, ITeam } from '@f2020/data';
import { falsy, truthy } from '@f2020/tools';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, combineLatest, first, map, switchMap } from 'rxjs';
import { FlagURLPipe } from '@f2020/shared';
import { MatButtonModule } from '@angular/material/button';
import { SelectDriverComponent } from '@f2020/control';
import { MatIconModule } from '@angular/material/icon';
import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { CardPageComponent } from '@f2020/shared';
import { NgIf, AsyncPipe } from '@angular/common';

@UntilDestroy()
@Component({
  selector: 'f2020-edit-race',
  templateUrl: './edit-race.component.html',
  standalone: true,
  imports: [
    NgIf,
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
  ],
})
export class EditRaceComponent implements OnInit {

  race$: Observable<IRace>;
  selectedDriver$: Observable<{ teams: ITeam[], drivers: string[]; }>;
  fg = this.fb.group({
    close: this.fb.control<string>(null),
    selectedDriver: this.fb.control<string>(null),
  });

  constructor(
    private fb: FormBuilder,
    private facade: RacesFacade,
    private snackBar: MatSnackBar,
    teamService: TeamService) {
    this.race$ = facade.selectedRace$;

    this.selectedDriver$ = combineLatest({
      teams: teamService.teams$,
      drivers: teamService.teams$.pipe(
        map(teams => teams.flatMap(team => team.drivers))
      )
    });
  }

  ngOnInit(): void {
    this.race$.pipe(
      untilDestroyed(this),
    ).subscribe(race => {
      this.fg.reset({
        selectedDriver: race.selectedDriver,
        close: race.close.toFormat('HH:mm'),
      });
    });
  };

  save() {
    this.race$.pipe(
      first(),
      map(race => {
        const close = race.close.set({
          hour: parseInt(this.fg.value.close.substring(0, 2)),
          minute: parseInt(this.fg.value.close.substring(3)),
        });
        const isChanged = race.selectedDriver !== this.fg.value.selectedDriver || +race.close !== +close;
        return isChanged
          ? ({
            ...race, ...{
              selectedDriver: this.fg.value.selectedDriver,
              close
            }
          })
          : undefined;
      }),
      first(),
    ).subscribe(race => race ? this.facade.dispatch(RacesActions.updateRace({ race })) : window.history.back());
    this.facade.updating$.pipe(
      truthy(),
      switchMap(() => this.facade.updating$),
      falsy(),
      switchMap(() => this.race$),
      first(),
    ).subscribe(race => {
      this.snackBar.open(`✔ ${race.name} er blevet opdateret`, null, { duration: 3000 });
      window.history.back();
    });
  }
}
