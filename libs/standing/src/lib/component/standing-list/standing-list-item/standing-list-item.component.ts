import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IDriverStanding } from '@f2020/data';
import { icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'f2020-standing-list-item',
  template: `
    <span class="flex flex-row justify-between items-center">
      <span class="flex flex-col">
        <span>{{ standing().driver.name }}</span>
        <span class="text-xs flex flex-row">
          @for (_ of wins(); track _) {
            <fa-icon class="mr-1" [icon]="trophyIcon" size="xs"></fa-icon>
          }
        </span>
      </span>
      <span>{{ standing().points }} point</span>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FaIconComponent],
})
export class StandingListItemComponent {

  readonly standing = input.required<IDriverStanding>();
  readonly wins = computed(() => Array(this.standing()?.wins ?? 0).fill(0));
  readonly trophyIcon = icon.farTrophy;


}
