import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IRaceResult } from '@f2020/data';

import { MatListModule } from '@angular/material/list';

@Component({
    selector: 'f2020-last-year-result',
    template: `
    <mat-list>
      @for (result of raceResult.results; track result) {
        <mat-list-item>
          <h5 matListItemTitle>{{result.driver.name}}</h5>
          <p matListItemMeta class="!text-base !text-white">{{result.points}}</p>
          <p matListItemLine>{{result.status}}</p>
        </mat-list-item>
      }
    </mat-list>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatListModule]
})
export class LastYearResultComponent {
  @Input() raceResult: IRaceResult;
}
