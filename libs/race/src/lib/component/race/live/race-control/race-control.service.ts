import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RACE_RESULT_SERVICE } from '@f2020/api';
import { IDriver, IRace, RaceControl } from '@f2020/data';
import { withLength } from '@f2020/tools';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, map, pairwise, startWith } from 'rxjs/operators';
import { RaceControlSnackbarComponent } from './race-control-snackbar.component';

@UntilDestroy()
@Injectable()
export class RaceControlService {
  #snackBar = inject(MatSnackBar);
  #live = inject(RACE_RESULT_SERVICE);

  #displayRaceControlMessage(raceControl: RaceControl): void {
    this.#snackBar.openFromComponent(RaceControlSnackbarComponent, {
      data: raceControl,
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'top',

    });
  }

  displayMessages(race: IRace, drivers: IDriver[]): void {
    this.#live.getRaceControl(race, drivers).pipe(
      withLength(),
      startWith([] as RaceControl[]), // Start with an empty array to ensure the first emission is handled
      pairwise(),
      filter(([previous, current]) => current.length > previous.length),
      map(([previous, current]) => current.slice(previous.length)),
      untilDestroyed(this),
    ).subscribe(messages => messages.forEach(message => this.#displayRaceControlMessage(message)));
  }
}
