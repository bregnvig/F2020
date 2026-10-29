import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DriversStore, PlayerStore, SeasonStore, TeamService } from '@f2020/api';
import { icon, injectRaceNames, LoadingComponent, SeasonChart, SeasonLine, TeamLogoComponent } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'teams-teams-graph',
  template: `
    <mat-toolbar color="primary">
      <span>Hold</span>
    </mat-toolbar>
    @if (standings()) {
      <sha-season-chart class="h-[60vh] px-2 pt-4" [lines]="lines()" [places]="teams().length" />
      <div class="max-w-3xl mx-auto pb-20">
        <mat-selection-list (selectionChange)="toggle($event)">
          @for (team of teams(); track team.id) {
            <mat-list-option [value]="team.id" [selected]="team.shown">
              <sha-team-logo matListItemAvatar [seasonId]="seasonId()" [name]="team.name" [size]="40" />
              <span matListItemTitle class="flex items-center gap-2">
                <span class="inline-block size-3 rounded-sm" [style.background]="team.color"></span>
                {{ team.name }}
              </span>
              <span matListItemLine class="flex items-center gap-1">
                {{ team.points }} point
                @for (_ of team.wins; track $index) {
                  <fa-icon [icon]="trophyIcon" size="xs" />
                }
              </span>
            </mat-list-option>
          }
        </mat-selection-list>
      </div>
      @if (anyShown()) {
        <button mat-fab extended (click)="showAll(false)">Fravælg alle</button>
      } @else {
        <button mat-fab extended (click)="showAll(true)">Vælg alle</button>
      }
    } @else {
      <sha-loading />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, MatListModule, MatButtonModule, FaIconComponent, SeasonChart, TeamLogoComponent, LoadingComponent],
})
export class TeamsGraph {
  #service = inject(TeamService);
  #drivers = inject(DriversStore).drivers;
  #player = inject(PlayerStore);
  #season = inject(SeasonStore);
  #named = injectRaceNames();

  protected readonly trophyIcon = icon.farTrophy;
  protected readonly seasonId = computed(() => this.#season.season().id);

  protected readonly standings = this.#service.standings;

  #hidden = computed(() => this.#player.player()?.hiddenGraphTeams ?? []);

  /** The teams with the most points first, in the color of the team, which OpenF1 has on the drivers */
  protected readonly teams = computed(() =>
    this.#service
      .teams()
      .map(team => {
        const standing = this.standings()?.[team.constructorId];
        return {
          id: team.constructorId,
          name: team.name,
          points: standing?.points ?? 0,
          wins: Array(standing?.wins ?? 0),
          rounds: standing?.rounds ?? {},
          color: `#${this.#drivers()?.find(d => d.teamName === team.name)?.teamColor ?? '9e9e9e'}`,
          shown: !this.#hidden().includes(team.constructorId),
        };
      })
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name)),
  );

  protected readonly anyShown = computed(() => this.teams().some(t => t.shown));

  protected readonly lines = computed<SeasonLine[]>(() =>
    this.teams()
      .filter(t => t.shown)
      .map(({ name, color, rounds }) => ({
        name,
        color,
        races: this.#named(Object.entries(rounds).map(([round, { position, points }]) => ({ round: +round, name: `${round}. runde`, results: [{ position, points }] }))),
      })),
  );

  /** The value is the id, as Material deselects an option when its value changes, and the teams are built again on every change */
  protected toggle({ options: [option] }: MatSelectionListChange) {
    const hidden = this.#hidden().filter(id => id !== option.value);
    this.#player.updatePlayer({ hiddenGraphTeams: option.selected ? hidden : [...hidden, option.value] });
  }

  protected showAll(show: boolean) {
    this.#player.updatePlayer({ hiddenGraphTeams: show ? [] : this.teams().map(t => t.id) });
  }
}
