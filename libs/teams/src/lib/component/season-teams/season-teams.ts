import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DriversStore, TeamService } from '@f2020/api';
import { TeamsList } from '@f2020/shared';

@Component({
  selector: 'teams-season-teams',
  template: ` <sha-teams-list [drivers]="drivers() ?? []" [teams]="teams()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TeamsList],
})
export class SeasonTeams {
  readonly #store = inject(DriversStore);
  readonly #service = inject(TeamService);

  teams = toSignal(this.#service.teams$, { initialValue: [] });
  drivers = this.#store.drivers;
}
