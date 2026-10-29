import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { DriversStore, TeamService } from '@f2020/api';
import { icon, TeamsList } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'teams-season-teams',
  template: `
    <sha-teams-list [drivers]="drivers() ?? []" [teams]="teams()" />
    <button mat-fab aria-label="Vis holdene som graf" routerLink="graph">
      <fa-icon [icon]="chartIcon" size="lg" />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TeamsList, MatButtonModule, RouterLink, FaIconComponent],
})
export class SeasonTeams {
  readonly #store = inject(DriversStore);
  readonly #service = inject(TeamService);

  teams = toSignal(this.#service.teams$, { initialValue: [] });
  drivers = this.#store.drivers;
  protected readonly chartIcon = icon.farChartLineUpDown;
}
