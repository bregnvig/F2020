import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'f2020-display-teams',
  template: `
    <mat-list>
      <mat-list-item *ngFor="let id of constructorIds; index as i">
        <h4 matListItemTitle>{{id | teamName}}</h4>
        <small matListItemLine *ngIf="points">{{points[i]}} point</small>
      </mat-list-item>
    </mat-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisplayTeamsComponent {

  @Input() constructorIds: string[];
  @Input() points: number[];
}
