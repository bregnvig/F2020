import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { RaceResultProvider } from '@f2020/api';
import { IDriver, IRace, IStint, Tyre } from '@f2020/data';
import { valueOf } from './track/car-progress';

const tyres: Record<Tyre, { letter: string; name: string; colour: string }> = {
  SOFT: { letter: 'S', name: 'Soft', colour: 'bg-red-600 text-white' },
  MEDIUM: { letter: 'M', name: 'Medium', colour: 'bg-yellow-400 text-black' },
  HARD: { letter: 'H', name: 'Hard', colour: 'bg-gray-100 text-black' },
  INTERMEDIATE: { letter: 'I', name: 'Intermediate', colour: 'bg-green-600 text-white' },
  FULL_WET: { letter: 'W', name: 'Wet', colour: 'bg-blue-600 text-white' },
};
const unknownTyre = { letter: '?', name: 'Ukendt', colour: 'bg-gray-500 text-white' };

interface StintBar {
  key: number;
  left: number;
  width: number;
  letter: string;
  colour: string;
  title: string;
}

/** The stints of each driver as bars along the laps of the race, the drivers in the order of the race */
@Component({
  selector: 'f2020-live-strategy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <mat-card class="h-full">
      <mat-card-header>
        <mat-card-title>Dækstrategi</mat-card-title>
      </mat-card-header>
      <mat-card-content class="!pt-3">
        @if (rows().length) {
          <div class="flex justify-between text-xs opacity-70 ms-12 mb-1">
            <span>Omgang 1</span>
            <span>{{ laps() }}</span>
          </div>
          @for (row of rows(); track row.driver.driverId) {
            <div class="flex items-center gap-2 h-6 mb-1">
              <span class="w-10 shrink-0 text-sm font-medium">{{ row.driver.code }}</span>
              <div class="relative flex-1 h-5">
                @for (bar of row.bars; track bar.key) {
                  <span class="absolute inset-y-0 rounded-sm text-xs font-bold flex items-center justify-center overflow-hidden border-e border-[#424242] {{ bar.colour }}"
                        [style.left.%]="bar.left" [style.width.%]="bar.width" [title]="bar.title">{{ bar.letter }}</span>
                }
              </div>
            </div>
          }
        } @else if (strategy.error()) {
          <p>Dækstrategien kunne ikke hentes</p>
        } @else {
          <p>Venter på dækkene...</p>
        }
      </mat-card-content>
    </mat-card>
  `,
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent],
})
export class LiveStrategyComponent {
  #live = inject(RaceResultProvider);

  race = input.required<IRace>();
  drivers = input.required<IDriver[]>();

  protected readonly strategy = rxResource({
    params: () => ({ race: this.race(), drivers: this.drivers() }),
    stream: ({ params }) => this.#live.getStrategy(params.race, params.drivers),
  });

  #positions = rxResource({
    params: () => ({ race: this.race(), drivers: this.drivers() }),
    stream: ({ params }) => this.#live.getPositions(params.race, params.drivers),
  });

  #strategyValue = valueOf(this.strategy);
  #positionsValue = valueOf(this.#positions);
  #currentLap = toSignal(this.#live.currentLap, { initialValue: 0 });
  #circuitLaps = httpResource<Record<string, number>>(() => 'assets/tracks/laps.json');

  /** The laps of the race, or the laps so far when they aren't known */
  protected readonly laps = computed(() => {
    const circuitId = this.race().circuitId;
    const laps = circuitId != null && this.#circuitLaps.hasValue() ? this.#circuitLaps.value()[circuitId] : undefined;
    return Math.max(laps ?? 0, this.#currentLap(), 1);
  });

  protected readonly rows = computed(() => {
    const laps = this.laps();
    const stints = (this.#strategyValue() ?? []).reduce((byDriver, stint) =>
      byDriver.set(stint.driver.driverId, [...(byDriver.get(stint.driver.driverId) ?? []), stint]), new Map<string, IStint[]>());
    const order = new Map((this.#positionsValue() ?? []).map(({ driver, position }) => [driver.driverId, position]));
    return [...stints.values()]
      .map(driverStints => ({
        driver: driverStints[0].driver,
        bars: driverStints.map((stint): StintBar => {
          const tyre = tyres[stint.compound] ?? unknownTyre;
          const stintLaps = stint.lapEnd - stint.lapStart + 1;
          return {
            key: stint.stintNumber,
            left: (stint.lapStart - 1) / laps * 100,
            width: stintLaps / laps * 100,
            letter: tyre.letter,
            colour: tyre.colour,
            title: `${tyre.name}, omgang ${stint.lapStart}-${stint.lapEnd}` + (stint.tyreAgeAtStart ? ` (brugt ${stint.tyreAgeAtStart} omg. før)` : ''),
          };
        }),
      }))
      .toSorted((a, b) => (order.get(a.driver.driverId) ?? Number.MAX_VALUE) - (order.get(b.driver.driverId) ?? Number.MAX_VALUE));
  });
}
