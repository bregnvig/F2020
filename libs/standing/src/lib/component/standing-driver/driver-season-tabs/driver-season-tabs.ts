import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IDriverResult } from '@f2020/data';
import { MatTabsModule } from '@angular/material/tabs';
import { DriverQualifyingComponent } from '../driver-qualifying/driver-qualifying.component';
import { DriverResultComponent } from '../driver-result/driver-result.component';

@Component({
  selector: 'f2020-driver-season-tabs',
  template: `
    <mat-tab-group selectedIndex="1">
      <mat-tab [label]="'Kvalifikation ' + year()">
        <f2020-driver-qualifying [qualifyResults]="currentSeason().qualify" />
      </mat-tab>
      <mat-tab [label]="'Resultat ' + year()">
        <f2020-driver-result [driverResult]="currentSeason()" />
      </mat-tab>
      <mat-tab [label]="'Kvalifikation ' + previousYear()">
        <f2020-driver-qualifying [qualifyResults]="previousSeason()?.qualify" />
      </mat-tab>
      <mat-tab [label]="'Resultat ' + previousYear()">
        <f2020-driver-result [driverResult]="previousSeason()" />
      </mat-tab>
    </mat-tab-group>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTabsModule, DriverQualifyingComponent, DriverResultComponent],
})
export class DriverSeasonTabs {
  readonly year = input.required<number>();
  readonly currentSeason = input.required<IDriverResult>();
  readonly previousSeason = input<IDriverResult | null>();

  protected readonly previousYear = computed(() => this.year() - 1);
}
