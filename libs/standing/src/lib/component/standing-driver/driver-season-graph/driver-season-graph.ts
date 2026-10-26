import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IDriverResult } from '@f2020/data';
import { MatCardModule } from '@angular/material/card';
import { LineChartModule } from '@swimlane/ngx-charts';

interface Race {
  round: number;
  name: string;
  results: { position?: number }[];
}

interface Point {
  name: number;
  value: number;
}

/** The name of the race without "Grand Prix", so it fits on the axis */
const shortName = (race: Race) => race.name.replace(/ Grand Prix$/, '');

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

const lines = [
  { label: 'Kvalifikation', color: '#90a4ae' },
  { label: 'Resultat', color: '#e91e63' },
];

@Component({
  selector: 'f2020-driver-season-graph',
  template: `
    <mat-card>
      <mat-card-content>
        <div class="h-72">
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
            [yAxisTicks]="ticks()"
            [yAxisTickFormatting]="place">
            <ng-template #tooltipTemplate let-model="model">{{ label(model.series) }}, {{ raceName(model.name) }}: {{ place(model.value) }}</ng-template>
          </ngx-charts-line-chart>
        </div>
        <div class="flex gap-4 pt-2 text-sm">
          @for (line of lines; track line.label) {
            <span class="flex items-center gap-1">
              <span class="inline-block size-3 rounded-sm" [style.background]="line.color"></span>
              {{ line.label }}
            </span>
          }
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    :host ::ng-deep .ngx-charts text {
      fill: currentColor;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, LineChartModule],
})
export class DriverSeasonGraph {
  readonly driverResult = input.required<IDriverResult>();

  protected readonly lines = lines;

  /** Every race of the season in order. The x of a race is its index, so the races are evenly spaced and in order, also when the driver
   * has no place in one of them */
  protected readonly races = computed(() =>
    [...new Map([...this.driverResult().qualify, ...this.driverResult().races].map(race => [race.round, shortName(race)])).entries()]
      .sort(([a], [b]) => a - b)
      .map(([round, name]) => ({ round, name })),
  );

  protected readonly xTicks = computed(() => this.races().map((_, index) => index));

  /** A series for each part of a line, named e.g. Resultat#2. They are told apart by the name, and get the color of the line */
  protected readonly data = computed(() =>
    [this.driverResult().qualify, this.driverResult().races].flatMap((races, line) =>
      segments(this.#points(races)).map((segment, index) => ({ name: `${lines[line].label}#${index}`, series: dash(segment) })),
    ),
  );

  protected readonly colors = computed(() => this.data().map(({ name }) => ({ name, value: lines.find(line => line.label === this.label(name))!.color })));

  /** The x of a dash is a little off the race */
  protected readonly raceName = (x: number) => this.races()[Math.round(x)]?.name ?? '';

  /** The lowest place of the season, and at least 20 so the graph does not jump between drivers */
  protected readonly last = computed(() => Math.max(20, ...this.data().flatMap(d => d.series.map(p => -p.value))));

  protected readonly ticks = computed(() => [1, 5, 10, 15, 20, this.last()].filter((tick, index, ticks) => ticks.indexOf(tick) === index).map(tick => -tick));

  /** The places are negative, so 1 is at the top of the graph */
  #points(races: Race[] = []): Point[] {
    return races
      .filter(race => race.results[0]?.position)
      .map(race => ({ name: this.races().findIndex(r => r.round === race.round), value: -race.results[0].position! }))
      .sort((a, b) => a.name - b.name);
  }

  protected label(series: string) {
    return series.split('#')[0];
  }

  protected place(value: number) {
    return `${Math.abs(value)}`;
  }
}
