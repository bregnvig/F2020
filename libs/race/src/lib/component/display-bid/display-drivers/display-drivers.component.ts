import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'f2020-display-drivers',
  template: `
    <mat-list>
      <mat-list-item *ngFor="let id of driverIds; index as i">
        <h4 matListItemTitle>{{id | driverName}}</h4>
        <small matListItemLine *ngIf="points">{{points[i]}} point</small>
      </mat-list-item>
    </mat-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisplayDriversComponent {

  @Input() driverIds: string[];
  @Input() points: number[];
}
