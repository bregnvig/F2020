import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { TeamNamePipe } from '@f2020/shared';
import { DisplayPointsDiffComponent } from '../diff/display-points-diff.component';

@Component({
  selector: 'f2020-display-teams',
  template: `
    <mat-list>
      @for (id of constructorIds(); track $index) {
        @let team = id | teamName;
        @if (team) {
          <mat-list-item>
            <div class="flex justify-between items-center w-full">
              <div class="flex flex-col text-sm font-medium">
                <span>{{ team }}</span>
                @if (points()) {
                  <small>{{ points()[$index] }} points</small>
                }
              </div>
              <div class="flex">
                <f2020-display-points-diff [postfix]="compareWith()?.[$index] | teamName" [value]="points()?.[$index]" [compareWith]="comparePoints()?.[$index]"/>
              </div>
            </div>
          </mat-list-item>
        }
      }
    </mat-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatListModule,
    TeamNamePipe,
    DisplayPointsDiffComponent,
  ],
})
export class DisplayTeamsComponent {
  readonly constructorIds = input.required<string[]>();
  readonly points = input<number[]>();
  readonly compareWith = input<string[]>();
  readonly comparePoints = input<number[]>();

}
