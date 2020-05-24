import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'f2020-display-drivers',
  template: `
    <mat-list>
      <mat-list-item *ngFor="let id of driverIds; index as i">
        <h4 matLine>{{id | driverName}}</h4>
        <p matLine *ngIf="points"><small>{{points[i]}} point</small></p>
      </mat-list-item>
    </mat-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisplayDriversComponent {

  @Input() driverIds: string[];
  @Input() points: number[];
}
