import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { RaceResultProvider } from '@f2020/api';
import { AnimatedForDirective } from '@f2020/shared';
import { IDriver, IRace, IStint, Tyre } from '@f2020/data';
import { valueOf } from './track/car-progress';

const tyres: Record<Tyre, { letter: string; name: string; colour: string }> = {
  SOFT: { letter: 'S', name: 'Blød', colour: 'bg-red-600 text-white' },
  MEDIUM: { letter: 'M', name: 'Medium', colour: 'bg-yellow-400 text-black' },
  HARD: { letter: 'H', name: 'Hård', colour: 'bg-gray-100 text-black' },
  INTERMEDIATE: { letter: 'I', name: 'Intermediate', colour: 'bg-green-600 text-white' },
  WET: { letter: 'W', name: 'Regn', colour: 'bg-blue-600 text-white' },
};
const unknownTyre = { letter: '?', name: 'Ukendt', colour: 'bg-gray-500 text-white' };

interface StrategyRow {
  driver: IDriver;
  bars: StintBar[];
}

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
          <div class="relative h-4 text-xs opacity-70 ms-12 mb-1">
            <span class="absolute left-0">Omgang 1</span>
            @for (marker of markers(); track marker.lap) {
              <span class="absolute -translate-x-1/2" [style.left.%]="marker.left">{{ marker.lap }}</span>
            }
            <span class="absolute right-0">{{ laps() }}</span>
          </div>
          <div class="relative">
            <!-- The rows are padded instead of spaced, as they are moved by their own height -->
            <div *shaAnimatedFor="let row of rows(); key: rowKey" class="flex items-center gap-2 h-7 py-0.5">
              <span class="w-10 shrink-0 text-sm font-medium">{{ row.driver.code }}</span>
              <div class="relative flex-1 h-full">
                @for (bar of row.bars; track bar.key) {
                  <span
                    class="absolute inset-y-0 rounded-sm text-xs font-bold flex items-center justify-center overflow-hidden border-e border-[#424242] {{ bar.colour }}"
                    [style.left.%]="bar.left"
                    [style.width.%]="bar.width"
                    [matTooltip]="bar.title"
                    #tooltip="matTooltip"
                    (click)="tooltip.show()">
                    {{ bar.letter }}
                  </span>
                }
              </div>
            </div>
            <!-- The lines split the laps in three, over the bars and under the tooltips -->
            <div class="absolute inset-y-0 left-12 right-0 pointer-events-none">
              @for (marker of markers(); track marker.lap) {
                <span class="absolute inset-y-0 border-s border-dashed border-white/40" [style.left.%]="marker.left"></span>
              }
            </div>
          </div>
        } @else if (strategy.error()) {
          <p>Dækstrategien kunne ikke hentes</p>
        } @else {
          <p>Venter på dækkene...</p>
        }
      </mat-card-content>
    </mat-card>
  `,
  imports: [AnimatedForDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatTooltip],
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

  /** The laps between the first and the last, evenly apart, at the end of the lap */
  protected readonly markers = computed(() => {
    const laps = this.laps();
    return [...new Set([1, 2].map(part => Math.round((laps * part) / 3)))].filter(lap => lap > 1 && lap < laps).map(lap => ({ lap, left: (lap / laps) * 100 }));
  });

  protected readonly rowKey = (row: StrategyRow) => row.driver.driverId;

  protected readonly rows = computed<StrategyRow[]>(() => {
    const laps = this.laps();
    const stints = (this.#strategyValue() ?? []).reduce(
      (byDriver, stint) => byDriver.set(stint.driver.driverId, [...(byDriver.get(stint.driver.driverId) ?? []), stint]),
      new Map<string, IStint[]>(),
    );
    const order = new Map((this.#positionsValue() ?? []).map(({ driver, position }) => [driver.driverId, position]));
    return [...stints.values()]
      .map(driverStints => ({
        driver: driverStints[0].driver,
        bars: driverStints.map((stint): StintBar => {
          const tyre = tyres[stint.compound] ?? unknownTyre;
          const stintLaps = stint.lapEnd - stint.lapStart + 1;
          return {
            key: stint.stintNumber,
            left: ((stint.lapStart - 1) / laps) * 100,
            width: (stintLaps / laps) * 100,
            letter: tyre.letter,
            colour: tyre.colour,
            title: `${tyre.name}, omgang ${stint.lapStart}-${stint.lapEnd}` + (stint.tyreAgeAtStart ? ` (brugt ${stint.tyreAgeAtStart} omg. før)` : ''),
          };
        }),
      }))
      .toSorted((a, b) => (order.get(a.driver.driverId) ?? Number.MAX_VALUE) - (order.get(b.driver.driverId) ?? Number.MAX_VALUE));
  });
}
