import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { RaceResultProvider } from '@f2020/api';
import { championshipNow, IDriver, IDriverRaceResult, IRace, positionChange, racePoints } from '@f2020/data';
import { ChampionshipEntry, ChampionshipListComponent } from '@f2020/shared';
import { valueOf } from './track/car-progress';

/** The points each driver gets for the place they are in now */
const pointsNow = (positions: IDriverRaceResult[]) => new Map(positions.map(({ driver, position }) => [driver, racePoints[position - 1] ?? 0]));

@Component({
  selector: 'f2020-live-championship',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>
          @if (type() === 'drivers') {
            Kørermesterskabet
          } @else {
            Konstruktørmesterskabet
          }
        </mat-card-title>
        <mat-card-subtitle>Hvis løbet sluttede nu</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (entries().length) {
          <sha-championship-list animated [entries]="entries()" />
        } @else if (start.error()) {
          <p class="mt-3">Mesterskabet kunne ikke hentes</p>
        } @else {
          <p class="mt-3">Henter mesterskabet...</p>
        }
      </mat-card-content>
    </mat-card>
  `,
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, ChampionshipListComponent],
})
export class LiveChampionshipComponent {
  #live = inject(RaceResultProvider);

  race = input.required<IRace>();
  drivers = input.required<IDriver[]>();
  type = input.required<'drivers' | 'teams'>();

  protected readonly start = rxResource({
    params: () => ({ race: this.race(), drivers: this.drivers() }),
    stream: ({ params }) => this.#live.getChampionshipStart(params.race, params.drivers),
  });

  #positions = rxResource({
    params: () => ({ race: this.race(), drivers: this.drivers() }),
    stream: ({ params }) => this.#live.getPositions(params.race, params.drivers),
  });

  #startValue = valueOf(this.start);
  #positionsValue = valueOf(this.#positions);

  protected readonly entries = computed<ChampionshipEntry[]>(() => {
    const start = this.#startValue();
    if (!start) return [];
    const gained = pointsNow(this.#positionsValue() ?? []);
    if (this.type() === 'drivers') {
      const drivers = new Map(this.drivers().map(driver => [driver.driverId, driver]));
      const gainedByDriver = new Map([...gained].map(([driver, points]) => [driver.driverId, points]));
      return championshipNow(start.drivers, gainedByDriver)
        .filter(({ key }) => drivers.has(key))
        .map(({ key, standing }) => ({
          id: key,
          name: drivers.get(key)!.name,
          position: standing.position,
          driver: drivers.get(key),
          points: standing.points,
          gained: standing.points - (standing.previousPoints ?? 0),
          change: positionChange(standing),
        }));
    }
    const gainedByTeam = [...gained].reduce((teams, [driver, points]) =>
      driver.teamName ? teams.set(driver.teamName, (teams.get(driver.teamName) ?? 0) + points) : teams, new Map<string, number>());
    return championshipNow(start.teams, gainedByTeam).map(({ key, standing }) => ({
      id: key,
      name: key,
      position: standing.position,
      logo: { seasonId: this.race().season },
      points: standing.points,
      gained: standing.points - (standing.previousPoints ?? 0),
      change: positionChange(standing),
    }));
  });
}
