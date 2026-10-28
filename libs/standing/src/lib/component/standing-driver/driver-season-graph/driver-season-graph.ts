import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IDriverResult } from '@f2020/data';
import { MatCardModule } from '@angular/material/card';
import { SeasonChart, SeasonLine } from '../../season-chart/season-chart';

@Component({
  selector: 'f2020-driver-season-graph',
  template: `
    <mat-card>
      <mat-card-content>
        <f2020-season-chart class="h-72" [lines]="lines()" />
        <div class="flex gap-4 pt-2 text-sm">
          @for (line of lines(); track line.name) {
            <span class="flex items-center gap-1">
              <span class="inline-block size-3 rounded-sm" [style.background]="line.color"></span>
              {{ line.name }}
            </span>
          }
        </div>
      </mat-card-content>
    </mat-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, SeasonChart],
})
export class DriverSeasonGraph {
  readonly driverResult = input.required<IDriverResult>();

  protected readonly lines = computed<SeasonLine[]>(() => [
    { name: 'Kvalifikation', color: '#90a4ae', races: this.driverResult().qualify },
    { name: 'Resultat', color: '#e91e63', races: this.driverResult().races },
  ]);
}
