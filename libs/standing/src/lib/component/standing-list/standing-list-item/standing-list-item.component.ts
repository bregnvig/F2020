import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IDriverStanding, positionChange } from '@f2020/data';
import { icon, PositionChangeComponent } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'f2020-standing-list-item',
  template: `
    <span class="flex flex-row justify-between items-center">
      <span class="flex flex-col">
        <span>{{ standing().driver.name }}</span>
        <span class="text-xs flex flex-row">
          @for (_ of wins(); track _) {
            <fa-icon class="mr-1" [icon]="trophyIcon" size="xs" />
          }
        </span>
      </span>
      <span class="flex flex-row items-center gap-2">
        <span class="text-right">
          @if (gained()) {
            <span class="text-xs opacity-70">(+{{ gained() }})</span>
          }
          {{ standing().points }} point
        </span>
        <span class="w-16 text-right">
          <sha-position-change [change]="change()" />
        </span>
      </span>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FaIconComponent, PositionChangeComponent],
})
export class StandingListItemComponent {
  readonly standing = input.required<IDriverStanding>();
  readonly wins = computed(() => Array(this.standing()?.wins ?? 0).fill(0));
  readonly change = computed(() => positionChange(this.standing()));
  readonly gained = computed(() => {
    const { points, previousPoints } = this.standing();
    return previousPoints === undefined ? 0 : points - previousPoints;
  });
  readonly trophyIcon = icon.farTrophy;
}
