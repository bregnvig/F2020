import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TeamNamePipe } from '@f2020/shared';
import { NgFor, NgIf } from '@angular/common';
import { MatListModule } from '@angular/material/list';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatListModule, NgFor, NgIf, TeamNamePipe]
})
export class DisplayTeamsComponent {

  @Input() constructorIds: string[];
  @Input() points: number[];
}
