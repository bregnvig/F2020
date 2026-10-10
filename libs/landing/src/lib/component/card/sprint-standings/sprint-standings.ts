import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RacesService, RacesStore } from '@f2020/api';
import { FlagURLPipe } from '@f2020/shared';
import { NgOptimizedImage } from '@angular/common';

/** Lets an admin update the driver and team standings after the sprint, while the race is closed */
@Component({
  selector: 'f2020-sprint-standings',
  template: `
    @if (race(); as race) {
      <mat-card>
        <mat-card-header>
          <img mat-card-avatar height="40" width="40" [ngSrc]="race | flagURL" [alt]="race.countryCode">
          <mat-card-title>Stilling efter sprinten</mat-card-title>
          <mat-card-subtitle>{{ race.name }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Hent kørernes og holdenes stilling efter sprinten. Sejren i sprinten tælles med, når løbet er kørt.</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button [disabled]="updating()" (click)="update()">OPDATER STILLING</button>
        </mat-card-actions>
      </mat-card>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, FlagURLPipe, NgOptimizedImage],
  host: {
    '[hidden]': '!race()',
  },
})
export class SprintStandingsComponent {
  #racesService = inject(RacesService);
  #snackBar = inject(MatSnackBar);
  #racesStore = inject(RacesStore);
  #closedRace = computed(() => this.#racesStore.races()?.find(race => race.state === 'closed'));

  #sprintSession = rxResource({
    params: () => this.#closedRace(),
    stream: ({ params }) => this.#racesService.getSprintSession(params),
  });

  /** The closed race, when it is a sprint weekend */
  protected readonly race = computed(() => this.#sprintSession.hasValue() && this.#sprintSession.value() ? this.#closedRace() : undefined);
  protected readonly updating = signal(false);

  protected update() {
    const race = this.race();
    if (!race) return;
    this.updating.set(true);
    this.#racesService.updateSprintStandings(race)
      .then(
        () => this.#snackBar.open('Stillingen er opdateret', undefined, { duration: 3000 }),
        error => this.#snackBar.open(`Stillingen kunne ikke opdateres: ${error.message}`, undefined, { duration: 10000 }),
      )
      .finally(() => this.updating.set(false));
  }
}
