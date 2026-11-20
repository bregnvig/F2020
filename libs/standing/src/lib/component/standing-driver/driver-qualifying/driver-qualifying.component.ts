import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { driverSessionLink } from '../driver-session-link';
import { IQualifyResult } from '@f2020/data';
import { QualifyingTimesComponent } from './qualifying-times/qualifying-times.component';

import { MatListModule } from '@angular/material/list';
import { NgOptimizedImage } from '@angular/common';
import { FlagURLPipe } from '@f2020/shared';

@Component({
  selector: 'f2020-driver-qualifying',
  template: `
    <mat-nav-list>
      @for (result of qualifyResults() ?? []; track $index) {
        <a mat-list-item [routerLink]="link(result.round)">
          <img matListItemAvatar height="40" width="40" [alt]="result.countryCode" [ngSrc]="result.countryCode | flagURL" />
          <h3 matListItemTitle>{{ result.name }}</h3>
          <span matListItemLine><f2020-qualifying-times [qualifying]="result.results[0]" /></span>
          <span class="focus-meta" matListItemMeta>{{ result.results[0]?.position ?? 'Ingen tid' }}</span>
        </a>
      }
    </mat-nav-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, RouterLink, NgOptimizedImage, FlagURLPipe, QualifyingTimesComponent],
})
export class DriverQualifyingComponent {
  qualifyResults = input.required<IQualifyResult[] | undefined>();
  /** The results are from last year */
  lastYear = input<boolean, string | boolean>(false, { transform: booleanAttribute });

  protected link(round: number) {
    return driverSessionLink(round, 'qualifying', this.lastYear());
  }
}
