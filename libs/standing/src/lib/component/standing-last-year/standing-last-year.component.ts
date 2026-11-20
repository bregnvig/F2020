import { ChangeDetectionStrategy, Component, computed, effect, inject, input, numberAttribute, resource } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RacesService, RacesStore, SeasonStore } from '@f2020/api';
import { FlagURLPipe, LoadingComponent } from '@f2020/shared';
import { LastYearQualifyComponent } from './last-year-qualify.component';
import { LastYearResultComponent } from './last-year-result.component';

/**
 * Last year's qualifying and result of a round, e.g. when a race of last year is chosen on the page of a driver, or of the circuit
 * of a race (`?circuit=`). Without either it is the round of the current race
 */
@Component({
  selector: 'f2020-standing-last-year',
  template: `
    @if (result(); as result) {
      <mat-toolbar color="primary">
        <img class="avatar" [src]="result.result.countryCode | flagURL" alt="Løbs flag" />
        <span class="text-ellipsis overflow-hidden">Sidste år - {{ result.result.name }}</span>
      </mat-toolbar>
      <div class="max-w-3xl mx-auto">
        <mat-tab-group [selectedIndex]="selectedTab()">
          <mat-tab label="Kvalifikation">
            <f2020-last-year-qualify [qualifyResult]="result.qualify" />
          </mat-tab>
          <mat-tab label="Resultat">
            <f2020-last-year-result [raceResult]="result.result" />
          </mat-tab>
        </mat-tab-group>
      </div>
    } @else if (loading()) {
      <sha-loading />
    } @else {
      <p class="p-4">Resultatet fra sidste år findes ikke</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, MatTabsModule, LastYearQualifyComponent, LastYearResultComponent, LoadingComponent, FlagURLPipe],
})
export class StandingLastYearComponent {
  #service = inject(RacesService);
  #store = inject(RacesStore);
  #season = inject(SeasonStore).season;

  readonly round = input<number | undefined, unknown>(undefined, { transform: (value: unknown) => (value === undefined ? undefined : numberAttribute(value)) });
  /** The tab shown, `qualifying` or `race` */
  readonly session = input<string>();
  /** The circuit id of a race this year, from the query */
  readonly circuit = input<string>();

  #chosen = computed(() => !!this.round() || !!this.circuit());
  #lastYear = resource({
    params: () => {
      const season = this.#season().id;
      const round = this.round();
      const circuit = this.circuit();
      return round ? { season, round } : circuit ? { season, circuit } : undefined;
    },
    loader: ({ params }) =>
      'round' in params ? this.#service.getLastYearRound(params.season, params.round) : this.#service.getLastYearResult(params.season, params.circuit),
  });
  protected readonly result = computed(() => (this.#chosen() ? this.#lastYear.value() : this.#store.lastYear()));
  protected readonly loading = computed(() => (this.#chosen() ? this.#lastYear.isLoading() : !this.#store.lastYearLoaded()));
  protected readonly selectedTab = computed(() => (this.session() === 'race' ? 1 : 0));

  constructor() {
    effect(() => {
      if (!this.#chosen()) this.#store.loadLastYear();
    });
  }
}
