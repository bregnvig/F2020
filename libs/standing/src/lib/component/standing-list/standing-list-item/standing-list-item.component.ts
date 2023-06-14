import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IDriverStanding } from '@f2020/data';

@Component({
    selector: 'f2020-standing-list-item',
    template: `
    <span class="flex flex-row justify-between items-center">
      <span>{{standing.driver.name}}</span>
      <span>{{standing.points}} point</span>
    </span>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
})
export class StandingListItemComponent {
  @Input() standing: IDriverStanding;

}
