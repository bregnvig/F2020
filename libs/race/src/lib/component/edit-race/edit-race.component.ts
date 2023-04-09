import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RacesActions, RacesFacade, TeamService } from '@f2020/api';
import { IRace, ITeam } from '@f2020/data';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { falshy, truthy } from '@f2020/tools';
import { Observable, combineLatest, first, map, switchMap } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'f2020-edit-race',
  templateUrl: './edit-race.component.html',
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
      map(race => ({
        ...race, ...{
          selectedDriver: this.fg.value.selectedDriver,
          close: race.close.set({
            hour: parseInt(this.fg.value.close.substring(0, 2)),
            minute: parseInt(this.fg.value.close.substring(3)),
          })
        }
      })),
      first(),
    ).subscribe(race => this.facade.dispatch(RacesActions.updateRace({ race })));
    this.facade.updating$.pipe(
      truthy(),
      switchMap(() => this.facade.updating$),
      falshy(),
      switchMap(() => this.race$),
      first(),
    ).subscribe(race => this.snackBar.open(`✔ ${race.name} er blevet opdateret`, null, { duration: 3000 }));
  }
}
