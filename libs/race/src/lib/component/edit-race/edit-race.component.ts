import { NgxMatTimepickerComponent, NgxMatTimepickerDirective } from '@alexfriesen/ngx-mat-timepicker';
import { AsyncPipe, NgOptimizedImage } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { RaceStore, TeamService } from '@f2020/api';
import { SelectDriverComponent } from '@f2020/control';
import { ITeam } from '@f2020/data';
import { CardPageComponent, FlagURLPipe, icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { UntilDestroy } from '@ngneat/until-destroy';
import { combineLatest, map, Observable } from 'rxjs';
import { MatInput } from '@angular/material/input';

@UntilDestroy()
@Component({
  selector: 'f2020-edit-race',
  templateUrl: './edit-race.component.html',
  imports: [
    CardPageComponent,
    ReactiveFormsModule,
    SelectDriverComponent,
    AsyncPipe,
    FlagURLPipe,
    NgxMatTimepickerComponent,
    NgxMatTimepickerDirective,
    MatCard,
    MatCardTitle,
    MatCardSubtitle,
    MatCardHeader,
    MatCardContent,
    MatFormField,
    MatIcon,
    MatLabel,
    FaIconComponent,
    MatCardActions,
    MatButton,
    MatInput,
    NgOptimizedImage,
  ],
})
export class EditRaceComponent {

  #fb = inject(FormBuilder);
  clockIcon = icon.farClock;

  private store = inject(RaceStore);

  race = this.store.race;
  selectedDriver$: Observable<{ teams: ITeam[], drivers: string[]; }>;
  fg = this.#fb.group({
    close: this.#fb.control<string>(null),
    selectedDriver: this.#fb.control<string>(null),
  });

  constructor(teamService: TeamService) {

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
