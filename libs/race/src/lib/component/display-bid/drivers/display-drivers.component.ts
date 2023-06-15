import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DriverNamePipe } from '@f2020/driver';
import { NgFor, NgIf } from '@angular/common';
import { MatListModule } from '@angular/material/list';

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
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatListModule, NgFor, NgIf, DriverNamePipe]
})
export class DisplayDriversComponent {

  @Input() driverIds: string[];
  @Input() points: number[];
}
