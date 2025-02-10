import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TeamNamePipe } from '@f2020/shared';

import { MatListModule } from '@angular/material/list';

@Component({
    selector: 'f2020-display-teams',
    template: `
    <mat-list>
      @for (id of constructorIds(); track id) {
        <mat-list-item>
          <h4 matListItemTitle>{{id | teamName}}</h4>
          @if (points) {
            <small matListItemLine>{{points()[$index]}} point</small>
          }
        </mat-list-item>
      }
    </mat-list>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatListModule, TeamNamePipe]
})
export class DisplayTeamsComponent {

  readonly constructorIds = input.required<string[]>();
  readonly points = input< number[]>();
}
