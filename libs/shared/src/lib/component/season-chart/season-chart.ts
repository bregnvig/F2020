import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LineChartModule } from '@swimlane/ngx-charts';

interface Race {
  round: number;
  name: string;
  /** The first is the place, and points are shown in the tooltip when there */
  results: { position?: number; points?: number }[];
}

export interface SeasonLine {
  name: string;
  color: string;
  races: Race[];
}

interface Point {
  name: number;
  value: number;
}

/** The points split where a race has no place, as ngx-charts draws a line across the gap */
const segments = (points: Point[]): Point[][] =>
  points.reduce<Point[][]>((acc, point, index) => {
    if (index && point.name - points[index - 1].name === 1) {
      acc.at(-1)!.push(point);
    } else {
      acc.push([point]);
    }
    return acc;
  }, []);

/** A race with no place on either side is a single point, which ngx-charts does not draw, so it is drawn as a short dash */
const dash = (segment: Point[]): Point[] =>
  segment.length === 1
    ? [
        { name: segment[0].name - 0.15, value: segment[0].value },
        { name: segment[0].name + 0.15, value: segment[0].value },
      ]
    : segment;

/** The places of each line through the season, with 1 at the top. It fills its host */
@Component({
  selector: 'sha-season-chart',
  template: `
    <!-- ngx-charts takes the size of its parent, padding included, so padding on the host would make it too big -->
    <div class="size-full">
      <ngx-charts-line-chart
        [results]="data()"
        [customColors]="colors()"
        [legend]="false"
        [xAxis]="true"
        [yAxis]="true"
        [autoScale]="false"
        [xScaleMin]="0"
        [xScaleMax]="races().length - 1"
        [xAxisTicks]="xTicks()"
        [xAxisTickFormatting]="shortRaceName"
        [yScaleMin]="-last()"
        [yScaleMax]="-1"
        [yAxisTicks]="yTicks()"
        [yAxisTickFormatting]="place">
        <ng-template #tooltipTemplate let-model="model">{{ lineName(model.series) }}, {{ raceName(model.name) }}: {{ place(model.value) }}{{ points(model) }}</ng-template>
        <ng-template #seriesTooltipTemplate let-model="model">
          <div class="py-1 text-left">
            <div class="pb-1 font-medium">{{ raceName(model[0]?.name) }}</div>
            @for (item of byPlace(model); track item.series) {
              <div class="flex items-center gap-2">
                <span class="inline-block size-3 rounded-sm" [style.background]="item.color"></span>
                {{ place(item.value) }}. {{ lineName(item.series) }}{{ points(item) }}
              </div>
            }
          </div>
        </ng-template>
      </ngx-charts-line-chart>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    :host ::ng-deep .ngx-charts text {
      fill: currentColor;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LineChartModule],
})
export class SeasonChart {
  readonly lines = input.required<SeasonLine[]>();
  /** The lowest place on the axis at least, so it does not jump when the lines change */
  readonly places = input(20);

  /** Every race in order. The x of a race is its index, so the races are evenly spaced, also when a line has no place in one of them */
  protected readonly races = computed(() =>
    [...new Map(this.lines().flatMap(line => line.races.map(race => [race.round, race.name] as const))).entries()]
      .sort(([a], [b]) => a - b)
      .map(([round, name]) => ({ round, name })),
  );

  protected readonly xTicks = computed(() => this.races().map((_, index) => index));

  /** A series for each part of a line, named by the index of the line and the part, e.g. 3#2. The places are negative, so 1 is at the top */
  protected readonly data = computed(() =>
    this.lines().flatMap((line, index) => {
      const points = line.races
        .filter(race => race.results[0]?.position)
        .map(race => ({ name: this.races().findIndex(r => r.round === race.round), value: -race.results[0].position! }))
        .sort((a, b) => a.name - b.name);
      return segments(points).map((segment, part) => ({ name: `${index}#${part}`, series: dash(segment) }));
    }),
  );

  protected readonly colors = computed(() => this.data().map(({ name }) => ({ name, value: this.#line(name).color })));

  protected readonly last = computed(() => Math.max(this.places(), ...this.data().flatMap(d => d.series.map(p => -p.value))));

  protected readonly yTicks = computed(() => [...new Set([1, 5, 10, 15, 20, this.last()])].filter(tick => tick <= this.last()).map(tick => -tick));

  /** The x of a dash is a little off the race */
  protected readonly raceName = (x: number) => this.races()[Math.round(x)]?.name ?? '';

  /** Without "Grand Prix", so the names fit on the axis */
  protected readonly shortRaceName = (x: number) => this.raceName(x).replace(/ Grand Prix$/, '');

  protected readonly place = (value: number) => `${Math.abs(value)}`;

  /** The lines at a race, best place first */
  protected byPlace(items: { series: string; name: number; value: number; color: string }[]) {
    return items.toSorted((a, b) => b.value - a.value);
  }

  /** The points of a line at a race, when the line has them */
  protected points({ series, name }: { series: string; name: number }) {
    const round = this.races()[Math.round(name)]?.round;
    const points = this.#line(series).races.find(race => race.round === round)?.results[0]?.points;
    return points === undefined ? '' : `, ${points} point`;
  }

  protected lineName(series: string) {
    return this.#line(series).name;
  }

  #line(series: string) {
    return this.lines()[parseInt(series, 10)];
  }
}
