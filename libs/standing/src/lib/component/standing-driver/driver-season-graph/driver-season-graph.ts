import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IDriverResult } from '@f2020/data';
import { MatCardModule } from '@angular/material/card';
import { LineChartModule } from '@swimlane/ngx-charts';
import { dash, lastPlace, place, placeTicks, points, seasonRaces, segments } from '../../season-graph';

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
  protected readonly place = place;

  protected readonly races = computed(() => seasonRaces([...this.driverResult().qualify, ...this.driverResult().races]));

  protected readonly xTicks = computed(() => this.races().map((_, index) => index));

  /** A series for each part of a line, named e.g. Resultat#2. They are told apart by the name, and get the color of the line */
  protected readonly data = computed(() =>
    [this.driverResult().qualify, this.driverResult().races].flatMap((races, line) =>
      segments(points(races, this.races())).map((segment, index) => ({ name: `${lines[line].label}#${index}`, series: dash(segment) })),
    ),
  );

  protected readonly colors = computed(() => this.data().map(({ name }) => ({ name, value: lines.find(line => line.label === this.label(name))!.color })));

  /** The x of a dash is a little off the race */
  protected readonly raceName = (x: number) => this.races()[Math.round(x)]?.name ?? '';

  protected readonly last = computed(() => lastPlace(this.data()));

  protected readonly ticks = computed(() => placeTicks(this.last()));

  protected label(series: string) {
    return series.split('#')[0];
  }
}
