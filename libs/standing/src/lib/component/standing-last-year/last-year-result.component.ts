import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IRaceResult } from '@f2020/data';

@Component({
  selector: 'f2020-last-year-result',
  template: `
    <mat-list>
      <mat-list-item *ngFor="let result of raceResult.results">
        <h5 matLine fxLayout><span fxFlex>{{result.driver.name}}</span>{{result.points}}</h5>
        <p matLine>{{result.status}}</p>
      </mat-list-item>
    </mat-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LastYearResultComponent {
  @Input() raceResult: IRaceResult;
}
