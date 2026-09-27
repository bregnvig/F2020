import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { DriversStore, RaceStore, TeamService } from '@f2020/api';
import { IRace, ITeam } from '@f2020/data';
import { TeamsList } from '@f2020/shared';
import { RaceTeamsApi } from './race-teams-api';

@Component({
  selector: 'race-drivers',
  template: '<sha-teams-list [drivers]="drivers()" [teams]="teams()" [race]="race()"/>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TeamsList],
  providers: [{ provide: TeamService, useClass: RaceTeamsApi }],
})
export class RaceDriversComponent {
  #store = inject(RaceStore);

  protected race: Signal<IRace> = this.#store.race;
  protected teams: Signal<ITeam[]> = this.#store.teams;
  protected drivers = inject(DriversStore).drivers;
}
