import { NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IDriverStanding } from '@f2020/data';
import { icon } from '@f2020/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'f2020-standing-list-item',
  template: `
    <span class="flex flex-row justify-between items-center">
      <span class="flex flex-col">
        <span>{{standing.driver.name}}</span>
        <span class="text-xs flex flex-row">
          <fa-icon *ngFor="let _ of wins" class="mr-1" [icon]="trophyIcon" size="xs"></fa-icon>
        </span>
      </span>
      <span>{{standing.points}} point</span>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgFor, FontAwesomeModule],
  standalone: true,
})
export class StandingListItemComponent {

  #standing: IDriverStanding;
  wins?: number[];

  @Input() set standing(value: IDriverStanding) {
    this.#standing = value;
    this.wins = Array(value.wins).fill(0);
  }

  get standing(): IDriverStanding {
    return this.#standing;
  }

  trophyIcon = icon.farTrophy;


}
