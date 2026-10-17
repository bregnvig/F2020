import { NgOptimizedImage } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, linkedSignal, signal } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { IDriver } from '@f2020/data';
import { DriverHeadshotComponent } from '../driver-headshot/driver-headshot';
import { PositionChangeComponent } from '../position-change/position-change';
import { TeamLogoComponent } from '../team-logo/team-logo';

export interface ChampionshipEntry {
  id: string;
  name: string;
  /** The place in the championship, shown in front of the name */
  position?: number;
  driver?: IDriver;
  image?: {
    url?: string;
  };
  /** Team logo shown in front of the name */
  logo?: {
    seasonId: string | number;
  };
  points: number;
  /** Points gained since the last race weekend */
  gained: number;
  /** Places moved since the last race weekend. Positive when moving up */
  change: number;
}

@Component({
  selector: 'sha-championship-list',
  template: `
    <mat-list>
      @for (row of rows(); track row.entry.id) {
        @let entry = row.entry;
        <mat-list-item [style.transform]="row.transform">
          <span class="flex flex-row justify-between items-center gap-2">
            <span class="flex flex-row items-center gap-4">
              @if (entry.driver; as driver) {
                <sha-driver-headshot [driver]="driver" />
              } @else if (entry.logo; as logo) {
                <sha-team-logo [seasonId]="logo.seasonId" [name]="entry.name" />
              } @else if (entry.image; as image) {
                <img class="rounded-full shrink-0" height="40" width="40" [ngSrc]="failedImages().has(entry.id) ? placeholder : image.url ?? placeholder"
                     [alt]="entry.name" (error)="imageFailed(entry.id)">
              }
              <span>
                @if (entry.position) {
                  {{ entry.position }}.
                }
                {{ entry.name }}
              </span>
            </span>
            <span class="flex flex-row items-center gap-2">
              <span class="text-right">
                @if (entry.gained) {
                  <span class="text-xs opacity-70">(+{{ entry.gained }})</span>
                }
                {{ entry.points }} point
              </span>
              <span class="hidden sm:block w-16 text-right">
                <sha-position-change [change]="entry.change" />
              </span>
            </span>
          </span>
        </mat-list-item>
      }
    </mat-list>
  `,
  styles: `
    mat-list {
      --mat-list-list-item-one-line-container-height: 56px;
    }

    mat-list-item {
      transition: transform 1s;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, NgOptimizedImage, DriverHeadshotComponent, PositionChangeComponent, TeamLogoComponent],
})
export class ChampionshipListComponent {
  entries = input.required<ChampionshipEntry[]>();
  /** The rows stay in the first order and slide to their new places, like the other live lists */
  animated = input<boolean, string | boolean>(false, { transform: booleanAttribute });

  /** The order of the rows in the page. Rows that come later are added at the end */
  #order = linkedSignal<ChampionshipEntry[], string[]>({
    source: this.entries,
    computation: (entries, previous) => {
      const ids = new Set(entries.map(entry => entry.id));
      const kept = (previous?.value ?? []).filter(id => ids.has(id));
      return [...kept, ...entries.map(entry => entry.id).filter(id => !kept.includes(id))];
    },
  });

  protected readonly rows = computed(() => {
    const entries = this.entries();
    if (!this.animated()) {
      return entries.map(entry => ({ entry, transform: null }));
    }
    const byId = new Map(entries.map((entry, index) => [entry.id, { entry, index }]));
    return this.#order().map((id, index) => {
      const { entry, index: place } = byId.get(id)!;
      return { entry, transform: `translateY(${(place - index) * 100}%)` };
    });
  });

  protected readonly placeholder = 'assets/loading/yellow.svg';
  protected readonly failedImages = signal(new Set<string>());

  protected imageFailed(id: string) {
    this.failedImages.update(failed => new Set(failed).add(id));
  }
}
