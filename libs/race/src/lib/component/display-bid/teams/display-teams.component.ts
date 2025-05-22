import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { NgClass } from '@angular/common';
import { TeamNamePipe } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { pointsDiffIcon } from '../display-bid.component';

@Component({
  selector: 'f2020-display-teams',
  template: `
    <mat-list>
      @for (id of constructorIds(); track $index) {
        @let team = id | teamName;
        @let compareTeam = findCompareTeam($index) | teamName;
        @let comparison = compareTeam && pointsDiffIcon(points()[$index], comparePoints()[$index]);
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
                @if (comparePoints() && comparePoints()[$index] !== undefined && comparison) {
                  <small class="rounded-full py-1 px-3" [ngClass]="comparison[1]">
                    @if (comparison[0]; as compIcon) {
                      <fa-icon class="text-sm" [icon]="compIcon"/>
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

  findCompareTeam(index: number): string {
    return this.compareConstructorIds()?.[index];
  }

  readonly pointsDiffIcon = pointsDiffIcon;
}
