import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LineChartModule } from '@swimlane/ngx-charts';

interface Race {
  round: number;
  name: string;
  results: { position?: number }[];
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
  selector: 'f2020-season-chart',
  template: `
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
      [xAxisTickFormatting]="raceName"
      [yScaleMin]="-last()"
      [yScaleMax]="-1"
      [yAxisTicks]="yTicks()"
      [yAxisTickFormatting]="place">
      <ng-template #tooltipTemplate let-model="model">{{ lineName(model.series) }}, {{ raceName(model.name) }}: {{ place(model.value) }}</ng-template>
    </ngx-charts-line-chart>
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

  /** Every race in order, without "Grand Prix" so the names fit. The x of a race is its index, so the races are evenly spaced,
   * also when a line has no place in one of them */
  protected readonly races = computed(() =>
    [...new Map(this.lines().flatMap(line => line.races.map(race => [race.round, race.name.replace(/ Grand Prix$/, '')] as const))).entries()]
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

  /** The lowest place, and at least 20 so the axis does not jump */
  protected readonly last = computed(() => Math.max(20, ...this.data().flatMap(d => d.series.map(p => -p.value))));

  protected readonly yTicks = computed(() => [...new Set([1, 5, 10, 15, 20, this.last()])].map(tick => -tick));

  /** The x of a dash is a little off the race */
  protected readonly raceName = (x: number) => this.races()[Math.round(x)]?.name ?? '';

  protected readonly place = (value: number) => `${Math.abs(value)}`;

  protected lineName(series: string) {
    return this.#line(series).name;
  }

  #line(series: string) {
    return this.lines()[parseInt(series, 10)];
  }
}
