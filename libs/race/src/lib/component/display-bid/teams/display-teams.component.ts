import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TeamNamePipe } from '@f2020/shared';

import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'f2020-display-teams',
  template: `
    <mat-list>
      @for (id of constructorIds; track id; let i = $index) {
        <mat-list-item>
          <h4 matListItemTitle>{{id | teamName}}</h4>
          @if (points) {
            <small matListItemLine>{{points[i]}} point</small>
          }
        </mat-list-item>
      }
    </mat-list>
    `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatListModule, TeamNamePipe]
})
export class DisplayTeamsComponent {

  @Input() constructorIds: string[];
  @Input() points: number[];
}
