import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IQualifyResult } from '@f2020/data';

@Component({
  selector: 'f2020-last-year-qualify',
  template: `
    <mat-list>
      <mat-list-item *ngFor="let result of qualifyResult.results">
        <h5 matListItemTitle class="flex flex-row justify-between">{{result.driver.name}}</h5>
        <p matListItemMeta class="!text-base !text-white">{{result.position}}</p>
        <p matListItemLine><f2020-qualifying-times [qualifying]="result"></f2020-qualifying-times></p>
      </mat-list-item>
    </mat-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LastYearQualifyComponent {

  @Input() qualifyResult: IQualifyResult;
}
