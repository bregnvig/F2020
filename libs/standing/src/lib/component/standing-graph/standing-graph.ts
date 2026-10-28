import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PlayerStore, SeasonStore, StandingService } from '@f2020/api';
import { IDriverStanding } from '@f2020/data';
import { DriverHeadshotComponent, LoadingComponent, TeamLogoComponent } from '@f2020/shared';
import { LineChartModule } from '@swimlane/ngx-charts';
import { distinctUntilChanged, map, switchMap } from 'rxjs';
import { StandingStore } from '../../+state/standing.store';
import { dash, lastPlace, place, placeTicks, points, Race, seasonRaces, segments } from '../season-graph';

type Show = 'race' | 'qualify';

/** The color mixed a part of the way to white, for the second driver of a team */
const lighten = (hex: string, amount = 0.45) =>
  `#${[0, 2, 4]
    .map(i => parseInt(hex.slice(i, i + 2), 16))
    .map(c => Math.round(c + (255 - c) * amount))
    .map(c => c.toString(16).padStart(2, '0'))
    .join('')}`;

const lines = [
  { key: 'qualify', label: 'Kvalifikation' },
  { key: 'races', label: 'Resultat' },
] as const;

const read = <T>(key: string): T | undefined => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? undefined;
  } catch {
    return undefined;
  }
};

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // What to show is only a convenience
  }
};

@Component({
  selector: 'f2020-standing-graph',
  template: `
    <mat-toolbar color="primary">
      <span>Kørere</span>
    </mat-toolbar>
    @if (results()) {
      <div class="flex justify-center pt-4 pb-2">
        <mat-button-toggle-group hideSingleSelectionIndicator [value]="show()" (change)="show.set($event.value)" aria-label="Vis">
          <mat-button-toggle value="race">Resultat</mat-button-toggle>
          <mat-button-toggle value="qualify">Kvalifikation</mat-button-toggle>
        </mat-button-toggle-group>
      </div>
      <div class="h-[60vh] px-2">
        <ngx-charts-line-chart
          [results]="data()"
          [customColors]="colors()"
          [legend]="false"
          [xAxis]="true"
          [yAxis]="true"
          [autoScale]="false"
          [xScaleMin]="0"
          [xScaleMax]="races().length - 1"
          [xAxisTicks]="xTicks()"
          [xAxisTickFormatting]="raceName"
          [yScaleMin]="-last()"
          [yScaleMax]="-1"
          [yAxisTicks]="ticks()"
          [yAxisTickFormatting]="place">
          <ng-template #tooltipTemplate let-model="model">{{ label(model.series) }}, {{ raceName(model.name) }}: {{ place(model.value) }}</ng-template>
        </ngx-charts-line-chart>
      </div>
      <div class="max-w-3xl mx-auto pb-20">
        <mat-selection-list (selectionChange)="toggle($event)">
          @for (team of teams(); track team.name) {
            <div mat-subheader class="flex items-center gap-2">
              @if (team.name) {
                <sha-team-logo [seasonId]="seasonId()" [name]="team.name" [size]="24" />
              }
              {{ team.name || 'Uden hold' }}
              @let shown = teamShown(team.drivers);
              <mat-checkbox
                class="ml-auto -mr-2"
                [checked]="shown === 'all'"
                [indeterminate]="shown === 'some'"
                (change)="toggleTeam(team.drivers, $event.checked)"
                [aria-label]="'Vis ' + (team.name || 'kørere uden hold')" />
            </div>
            @for (standing of team.drivers; track standing.driver.driverId) {
              @let driverId = id(standing.driver.driverId);
              <mat-list-option [value]="driverId" [selected]="selected().includes(driverId)">
                <sha-driver-headshot matListItemAvatar [driver]="standing.driver" />
                <span matListItemTitle class="flex items-center gap-2">
                  @if (color(driverId); as color) {
                    <span class="inline-block size-3 rounded-sm" [style.background]="color"></span>
                  }
                  {{ standing.driver.name }}
                </span>
                <span matListItemLine>{{ standing.points }} point</span>
              </mat-list-option>
            }
          }
        </mat-selection-list>
      </div>
      @if (selected().length) {
        <button mat-fab extended (click)="showAll(false)">Fravælg alle</button>
      } @else {
        <button mat-fab extended (click)="showAll(true)">Vælg alle</button>
      }
    } @else {
      <sha-loading />
    }
  `,
  styles: `
    :host ::ng-deep .ngx-charts text {
      fill: currentColor;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatToolbarModule,
    MatButtonToggleModule,
    MatListModule,
    MatCheckboxModule,
    MatButtonModule,
    LineChartModule,
    DriverHeadshotComponent,
    TeamLogoComponent,
    LoadingComponent,
  ],
  providers: [StandingStore],
})
export class StandingGraph {
  #store = inject(StandingStore);
  #service = inject(StandingService);
  #player = inject(PlayerStore);
  #season = inject(SeasonStore);

  protected readonly place = place;
  protected readonly seasonId = computed(() => this.#season.season().id);
  /** Both used to be an option, so anything but qualify is the race */
  protected readonly show = signal<Show>(read<string>('standingGraphShow') === 'qualify' ? 'qualify' : 'race');

  protected readonly results = toSignal(
    toObservable(this.#season.season).pipe(
      map(season => season.id),
      distinctUntilChanged(),
      switchMap(id => this.#service.getDriverResults(id, id)),
      takeUntilDestroyed(),
    ),
  );

  /** The drivers by team, with the team with the most points first */
  protected readonly teams = computed(() => {
    const teams = Map.groupBy(this.#store.standings() ?? [], s => s.driver.teamName ?? '');
    return [...teams.entries()]
      .map(([name, drivers]) => ({
        name,
        points: drivers.reduce((sum, s) => sum + s.points, 0),
        drivers: drivers.toSorted((a, b) => b.points - a.points || a.driver.name.localeCompare(b.driver.name)),
      }))
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  });

  protected readonly standings = computed(() => this.teams().flatMap(team => team.drivers));

  /** Every driver, except those the player has hidden */
  protected readonly selected = computed(() => {
    const hidden = this.#player.player()?.hiddenGraphDrivers ?? [];
    return this.standings()
      .map(s => this.id(s.driver.driverId))
      .filter(driverId => !hidden.includes(driverId));
  });

  /** The team color of each driver. The second driver of a team in the standings gets a lighter variant */
  #colors = computed(
    () =>
      new Map(
        this.standings().map((standing, index, standings) => {
          const color = standing.driver.teamColor ?? '9e9e9e';
          const second = !!standing.driver.teamName && standings.findIndex(s => s.driver.teamName === standing.driver.teamName) < index;
          return [this.id(standing.driver.driverId), second ? lighten(color) : `#${color}`];
        }),
      ),
  );

  protected readonly races = computed(() => seasonRaces((this.results() ?? []).flatMap(result => [...result.qualify, ...result.races])));

  protected readonly xTicks = computed(() => this.races().map((_, index) => index));

  /** A series for each part of a line, named e.g. ver|races#2. They are told apart by the name, and get the color of the driver */
  protected readonly data = computed(() => {
    const line = this.show() === 'race' ? 'races' : 'qualify';
    return this.selected().flatMap(driverId => {
      const result = this.results()?.find(r => r.driverId === driverId);
      return result ? segments(points(result[line] as Race[], this.races())).map((segment, index) => ({ name: `${driverId}|${line}#${index}`, series: dash(segment) })) : [];
    });
  });

  protected readonly colors = computed(() => this.data().map(({ name }) => ({ name, value: this.color(name.split('|')[0]) })));

  /** The x of a dash is a little off the race */
  protected readonly raceName = (x: number) => this.races()[Math.round(x)]?.name ?? '';

  protected readonly last = computed(() => lastPlace(this.data()));

  protected readonly ticks = computed(() => placeTicks(this.last()));

  constructor() {
    this.#store.loadStandings();
    effect(() => write('standingGraphShow', this.show()));
  }

  /** The documents of the results are named by the driver id in lower case */
  protected id(driverId: string) {
    return driverId.toLowerCase();
  }

  protected color(driverId: string): string | undefined {
    return this.#colors().get(driverId);
  }

  protected label(series: string) {
    const [driverId, line] = series.split(/[|#]/);
    const name = this.standings().find(s => this.id(s.driver.driverId) === driverId)?.driver.name ?? driverId;
    return `${name}, ${lines.find(l => l.key === line)!.label}`;
  }

  protected toggle({ options }: MatSelectionListChange) {
    const driverId: string = options[0].value;
    const hidden = this.#player.player()?.hiddenGraphDrivers ?? [];
    this.#player.updatePlayer({ hiddenGraphDrivers: hidden.includes(driverId) ? hidden.filter(id => id !== driverId) : [...hidden, driverId] });
  }

  protected teamShown(drivers: IDriverStanding[]): 'all' | 'some' | 'none' {
    const shown = drivers.filter(s => this.selected().includes(this.id(s.driver.driverId))).length;
    return shown === drivers.length ? 'all' : shown ? 'some' : 'none';
  }

  protected showAll(show: boolean) {
    this.#player.updatePlayer({ hiddenGraphDrivers: show ? [] : this.standings().map(s => this.id(s.driver.driverId)) });
  }

  /** Shows or hides every driver of a team */
  protected toggleTeam(drivers: IDriverStanding[], show: boolean) {
    const driverIds = drivers.map(s => this.id(s.driver.driverId));
    const hidden = (this.#player.player()?.hiddenGraphDrivers ?? []).filter(id => !driverIds.includes(id));
    this.#player.updatePlayer({ hiddenGraphDrivers: show ? hidden : [...hidden, ...driverIds] });
  }
}
