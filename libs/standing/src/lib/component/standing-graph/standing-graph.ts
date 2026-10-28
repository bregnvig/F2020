import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PlayerStore, SeasonStore, StandingService } from '@f2020/api';
import { DriverHeadshotComponent, LoadingComponent, TeamLogoComponent } from '@f2020/shared';
import { StandingStore } from '../../+state/standing.store';
import { SeasonChart, SeasonLine } from '../season-chart/season-chart';

/** The color mixed a part of the way to white, for the second driver of a team */
const lighten = (hex: string, amount = 0.45) =>
  `#${[0, 2, 4]
    .map(i => parseInt(hex.slice(i, i + 2), 16))
    .map(c => Math.round(c + (255 - c) * amount))
    .map(c => c.toString(16).padStart(2, '0'))
    .join('')}`;

@Component({
  selector: 'f2020-standing-graph',
  template: `
    <mat-toolbar color="primary">
      <span>Kørere</span>
    </mat-toolbar>
    @if (results.hasValue()) {
      <div class="flex justify-center pt-4 pb-2">
        <mat-button-toggle-group hideSingleSelectionIndicator [value]="session()" (change)="session.set($event.value)" aria-label="Vis">
          <mat-button-toggle value="races">Resultat</mat-button-toggle>
          <mat-button-toggle value="qualify">Kvalifikation</mat-button-toggle>
        </mat-button-toggle-group>
      </div>
      <f2020-season-chart class="h-[60vh] px-2" [lines]="lines()" />
      <div class="max-w-3xl mx-auto pb-20">
        <mat-selection-list (selectionChange)="toggle($event)">
          @for (team of teams(); track team.name) {
            <div mat-subheader class="flex items-center gap-2">
              @if (team.name) {
                <sha-team-logo [seasonId]="seasonId()" [name]="team.name" [size]="24" />
              }
              {{ team.name || 'Uden hold' }}
              <mat-checkbox
                class="ml-auto -mr-2"
                [checked]="team.shown === team.drivers.length"
                [indeterminate]="team.shown > 0 && team.shown < team.drivers.length"
                (change)="showDrivers(team.drivers, $event.checked)"
                [aria-label]="'Vis ' + (team.name || 'kørere uden hold')" />
            </div>
            @for (driver of team.drivers; track driver.id) {
              <mat-list-option [value]="driver.id" [selected]="driver.shown">
                <sha-driver-headshot matListItemAvatar [driver]="driver.driver" />
                <span matListItemTitle class="flex items-center gap-2">
                  <span class="inline-block size-3 rounded-sm" [style.background]="driver.color"></span>
                  {{ driver.driver.name }}
                </span>
                <span matListItemLine>{{ driver.points }} point</span>
              </mat-list-option>
            }
          }
        </mat-selection-list>
      </div>
      @if (anyShown()) {
        <button mat-fab extended (click)="showDrivers(drivers(), false)">Fravælg alle</button>
      } @else {
        <button mat-fab extended (click)="showDrivers(drivers(), true)">Vælg alle</button>
      }
    } @else {
      <sha-loading />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, MatButtonToggleModule, MatListModule, MatCheckboxModule, MatButtonModule, SeasonChart, DriverHeadshotComponent, TeamLogoComponent, LoadingComponent],
  providers: [StandingStore],
})
export class StandingGraph {
  #store = inject(StandingStore);
  #service = inject(StandingService);
  #player = inject(PlayerStore);
  #season = inject(SeasonStore);

  protected readonly session = signal<'races' | 'qualify'>('races');
  protected readonly seasonId = computed(() => this.#season.season().id);

  protected readonly results = rxResource({
    params: () => this.seasonId(),
    stream: ({ params: seasonId }) => this.#service.getDriverResults(seasonId, seasonId),
  });

  #hidden = computed(() => this.#player.player()?.hiddenGraphDrivers ?? []);

  /** The drivers by team, best team first. The second driver of a team has a lighter variant of the team color */
  protected readonly teams = computed(() =>
    [...Map.groupBy(this.#store.standings() ?? [], s => s.driver.teamName ?? '')]
      .map(([name, standings]) => {
        const drivers = standings
          .toSorted((a, b) => b.points - a.points || a.driver.name.localeCompare(b.driver.name))
          .map(({ driver, points }, index) => {
            const id = driver.driverId.toLowerCase();
            const color = driver.teamColor ?? '9e9e9e';
            return { id, driver, points, color: name && index ? lighten(color) : `#${color}`, shown: !this.#hidden().includes(id) };
          });
        return { name, drivers, points: drivers.reduce((sum, d) => sum + d.points, 0), shown: drivers.filter(d => d.shown).length };
      })
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name)),
  );

  protected readonly drivers = computed(() => this.teams().flatMap(team => team.drivers));

  protected readonly anyShown = computed(() => this.drivers().some(d => d.shown));

  protected readonly lines = computed<SeasonLine[]>(() =>
    this.drivers()
      .filter(d => d.shown)
      .map(d => ({ name: d.driver.name, color: d.color, races: this.results.value()?.find(r => r.driverId === d.id)?.[this.session()] ?? [] })),
  );

  constructor() {
    this.#store.loadStandings();
  }

  /** The value is the id, as Material deselects an option when its value changes, and the drivers are built again on every change */
  protected toggle({ options: [option] }: MatSelectionListChange) {
    this.showDrivers([{ id: option.value }], option.selected);
  }

  protected showDrivers(drivers: { id: string }[], show: boolean) {
    const ids = drivers.map(d => d.id);
    const hidden = this.#hidden().filter(id => !ids.includes(id));
    this.#player.updatePlayer({ hiddenGraphDrivers: show ? hidden : [...hidden, ...ids] });
  }
}
