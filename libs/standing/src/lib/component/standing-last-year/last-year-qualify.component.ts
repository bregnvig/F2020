import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IQualifyResult } from '@f2020/data';
import { QualifyingTimesComponent } from '../standing-driver/driver-qualifying/qualifying-times/qualifying-times.component';

import { MatListModule } from '@angular/material/list';

@Component({
    selector: 'f2020-last-year-qualify',
    template: `
    <mat-list>
      @for (result of qualifyResult.results; track result) {
        <mat-list-item>
          <h5 matListItemTitle class="flex flex-row justify-between">{{result.driver.name}}</h5>
          <p matListItemMeta class="!text-base !text-white">{{result.position}}</p>
          <p matListItemLine><f2020-qualifying-times [qualifying]="result"></f2020-qualifying-times></p>
        </mat-list-item>
      }
    </mat-list>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatListModule, QualifyingTimesComponent]
})
export class LastYearQualifyComponent {

  @Input() qualifyResult: IQualifyResult;
}
