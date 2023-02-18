import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IQualifyResult } from '@f2020/data';

@Component({
  selector: 'f2020-last-year-qualify',
  template: `
    <mat-list>
      <mat-list-item *ngFor="let result of qualifyResult.results">
        <h5 matListItemLine fxLayout><span fxFlex>{{result.driver.name}}</span>{{result.position}}</h5>
        <p matListItemLine><f2020-qualifying-times [qualifying]="result"></f2020-qualifying-times></p>
      </mat-list-item>
    </mat-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LastYearQualifyComponent {

  @Input() qualifyResult: IQualifyResult;
}
