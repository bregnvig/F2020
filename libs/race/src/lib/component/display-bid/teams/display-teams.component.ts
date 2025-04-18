import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { NgClass } from '@angular/common';
import { icon, TeamNamePipe } from '@f2020/shared';
import { FaIconComponent, IconName, IconPrefix } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'f2020-display-teams',
  template: `
    <mat-list>
      @for (id of constructorIds(); track $index) {
        @let team = id | teamName;
        @let compareTeam = findCompareTeam($index) | teamName;
        @let comparison = compareTeam && pointComparison(points()[$index], comparePoints()[$index]);
        @if (team) {
          <mat-list-item class="team-item">
            <div class="flex flex-col w-full">
              <div class="flex justify-between text-sm font-medium">
                <span>{{ team }}</span>
                @if (compareTeam) {
                  <span class="text-gray-400">
                    {{ compareTeam }}
                  </span>
                }
              </div>
              <div class="flex justify-between">
                <small>{{ points()[$index] }} points</small>
                @if (comparePoints() && comparePoints()[$index] !== undefined) {
                  <small [ngClass]="comparison[1]">
                    @if (comparison[0]; as compIcon) {
                      <fa-icon class="text-sm" [icon]="compIcon" />
                    }
                    {{ comparePoints()[$index] }} points
                  </small>
                }
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
    FaIconComponent,
    NgClass,
  ],
})
export class DisplayTeamsComponent {
  readonly constructorIds = input.required<string[]>();
  readonly points = input<number[]>();
  readonly compareConstructorIds = input<string[]>();
  readonly comparePoints = input<number[]>();

  findCompareTeam(index: number): string {
    return this.compareConstructorIds()?.[index];
  }

  pointComparison(teamPoints: number, compareTeamPoints: number): [[IconPrefix, IconName] | undefined, string] {
    if (teamPoints < compareTeamPoints) {
      return [icon.farArrowUp, 'text-green-500'];
    } else if (teamPoints > compareTeamPoints) {
      return [icon.farArrowDown, 'text-red-500'];
    }
    return [undefined, 'text-gray-500'];
  }
}
