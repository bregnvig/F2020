import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
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
        @let comparison = compareTeam && pointComparison();
        @if (team) {
          <mat-list-item>
            <div class="flex justify-between items-center w-full">
              <div class="flex flex-col text-sm font-medium">
                <span>{{ team }}</span>
                <small>{{ points()[$index] }} points</small>
              </div>
              <div class="flex">
                @if (comparePoints() && comparePoints()[$index] !== undefined && comparison) {
                  <small class="rounded-full py-1 px-3" [ngClass]="comparison[1]">
                    @if (comparison[0]; as compIcon) {
                      <fa-icon class="text-sm" [icon]="compIcon" />
                    }
                    {{ comparePoints()[$index] }}
                    - {{ compareTeam }}
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
  readonly pointComparison = computed((): [[IconPrefix, IconName] | undefined, string] => {
    if (this.points() < this.comparePoints()) {
      return [icon.fasAngleUp, 'bg-lime-700'];
    } else if (this.points() > this.comparePoints()) {
      return [icon.fasAngleDown, 'bg-red-700'];
    }
    return [undefined, 'bg-gray-500'];
  });

  findCompareTeam(index: number): string {
    return this.compareConstructorIds()?.[index];
  }

}
