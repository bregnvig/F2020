import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { SeasonStore } from '@f2020/api';
import { TeamLogoComponent, TeamNamePipe } from '@f2020/shared';

/**
 * Logos of the teams in a row, aligned to the right, with the team name as tooltip.
 */
@Component({
  selector: 'f2020-team-logos',
  template: `
    @if (seasonId(); as seasonId) {
      @for (constructorId of constructorIds(); track $index) {
        @let name = constructorId | teamName;
        @if (name) {
          <sha-team-logo [seasonId]="seasonId" [name]="name" [matTooltip]="name"/>
        }
      }
    }
  `,
  host: {
    class: 'flex flex-row items-center gap-1 ml-auto',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TeamNamePipe, TeamLogoComponent, MatTooltip],
})
export class TeamLogosComponent {
  readonly #season = inject(SeasonStore).season;

  readonly constructorIds = input.required<string[], (string | null | undefined)[] | null | undefined>({
    transform: value => (value ?? []).filter(id => !!id),
  });

  protected readonly seasonId = computed(() => this.#season()?.id);
}
