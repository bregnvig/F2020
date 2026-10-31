import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, resource } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { RacesService, RaceStore } from '@f2020/api';
import { IDriverSessionResult, sessionId, sessionName } from '@f2020/data';
import { CardPageComponent, DriverHeadshotComponent, FlagURLPipe, LoadingComponent } from '@f2020/shared';
import { Duration } from 'luxon';

const statuses: Record<NonNullable<IDriverSessionResult['status']>, string> = {
  dnf: 'Udgået',
  dns: 'Startede ikke',
  dsq: 'Diskvalificeret',
};

const time = (milliseconds: number) => Duration.fromMillis(milliseconds).toFormat(milliseconds >= 3_600_000 ? 'h:mm:ss.SSS' : 'm:ss.SSS');

/** The time of the winner, and the gap to the winner for the others */
const result = (entry: IDriverSessionResult, index: number): string => {
  if (entry.status) return statuses[entry.status];
  if (typeof entry.gapToLeader === 'string') return entry.gapToLeader;
  if (index && entry.gapToLeader) return `+${(entry.gapToLeader / 1000).toFixed(3)}`;
  return entry.duration ? time(entry.duration) : '';
};

@Component({
  selector: 'f2020-session-result',
  template: `
    <sha-card-page>
      @if (race(); as race) {
        <mat-card>
          <mat-card-header>
            <img mat-card-avatar width="40" height="40" [ngSrc]="race | flagURL" [alt]="race.countryCode" />
            <mat-card-title>{{ title() }}</mat-card-title>
            <mat-card-subtitle>{{ race.name }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (results.isLoading()) {
              <sha-loading />
            } @else if (results.error()) {
              <p class="mt-4">Resultatet kunne ikke hentes. Prøv igen om lidt.</p>
            } @else {
              <mat-list>
                @for (entry of entries(); track entry.driver.driverId) {
                  <mat-list-item>
                    <span class="flex flex-row justify-between items-center gap-4">
                      <span class="flex flex-row items-center gap-4">
                        <span class="w-6 text-right tabular-nums opacity-70">{{ entry.position }}</span>
                        <sha-driver-headshot [driver]="entry.driver" />
                        <span class="flex flex-col">
                          <span>{{ entry.driver.name }}</span>
                          <span class="text-xs opacity-70">{{ entry.driver.teamName }}</span>
                        </span>
                      </span>
                      <span class="text-sm tabular-nums" [class.opacity-70]="entry.status">{{ entry.result }}</span>
                    </span>
                  </mat-list-item>
                } @empty {
                  <p class="mt-4">OpenF1 har ikke resultatet endnu</p>
                }
              </mat-list>
            }
          </mat-card-content>
        </mat-card>
      }
    </sha-card-page>
  `,
  styles: `
    mat-list {
      --mat-list-list-item-one-line-container-height: 56px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatListModule, NgOptimizedImage, CardPageComponent, DriverHeadshotComponent, FlagURLPipe, LoadingComponent],
})
export class SessionResultComponent {
  #service = inject(RacesService);

  /** The session id from the route, e.g. `practice-1` */
  readonly session = input.required<string>();

  protected readonly race = inject(RaceStore).race;
  protected readonly title = computed(() => {
    const session = this.race()?.schedule?.find(s => sessionId(s) === this.session());
    return session ? sessionName(session) : 'Resultat';
  });
  protected readonly results = resource({
    params: () => (this.race() ? { race: this.race(), session: this.session() } : undefined),
    loader: ({ params }) => this.#service.getSessionResult(params.race, params.session),
  });
  protected readonly entries = computed(() => (this.results.value() ?? []).map((entry, index) => ({ ...entry, result: result(entry, index) })));
}
