import { DestroyRef, inject, Service, signal } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LiveSessionProvider } from '@f2020/api';
import { IDriver, IRace, RaceControl } from '@f2020/data';
import { withLength } from '@f2020/tools';
import { filter, map, pairwise, startWith, tap } from 'rxjs/operators';
import { RaceControlSheetComponent } from './race-control-sheet';
import { RaceControlSnackbarComponent, RaceControlSnackbarData } from './race-control-snackbar.component';

@Service({ autoProvided: false })
export class RaceControlService {
  #snackBar = inject(MatSnackBar);
  #live = inject(LiveSessionProvider);
  #destroyRef = inject(DestroyRef);
  #bottomSheet = inject(MatBottomSheet);
  #messages = signal<RaceControl[]>([]);

  /** All the messages so far, newest first. The sheet follows the messages as they come */
  openAll(): void {
    this.#bottomSheet.open(RaceControlSheetComponent, { data: this.#messages.asReadonly() });
  }

  #displayRaceControlMessage(raceControl: RaceControl): void {
    this.#snackBar.openFromComponent<RaceControlSnackbarComponent, RaceControlSnackbarData>(RaceControlSnackbarComponent, {
      data: { message: raceControl, openAll: () => this.openAll() },
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'top',

    });
  }

  displayMessages(race: IRace, drivers: IDriver[]): void {
    this.#live.getRaceControl(race, drivers).pipe(
      tap(messages => this.#messages.set(messages)),
      withLength(),
      startWith([] as RaceControl[]), // Start with an empty array to ensure the first emission is handled
      pairwise(),
      filter(([previous, current]) => current.length > previous.length),
      map(([previous, current]) => current.slice(previous.length)),
      takeUntilDestroyed(this.#destroyRef),
    ).subscribe(messages => messages.forEach(message => this.#displayRaceControlMessage(message)));
  }
}
