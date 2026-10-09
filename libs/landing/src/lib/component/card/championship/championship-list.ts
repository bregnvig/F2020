import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { PositionChangeComponent, TeamLogoComponent } from '@f2020/shared';

export interface ChampionshipEntry {
  id: string;
  name: string;
  /** Photo shown in front of the name */
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
  selector: 'f2020-championship-list',
  template: `
    <mat-list>
      @for (entry of entries(); track entry.id) {
        <mat-list-item>
          <span class="flex flex-row justify-between items-center gap-2">
            <span class="flex flex-row items-center gap-3">
              @if (entry.logo; as logo) {
                <sha-team-logo [seasonId]="logo.seasonId" [name]="entry.name"/>
              } @else if (entry.image; as image) {
                <img class="rounded-full shrink-0" height="40" width="40" [ngSrc]="failedImages().has(entry.id) ? placeholder : image.url ?? placeholder"
                     [alt]="entry.name" (error)="imageFailed(entry.id)">
              }
              <span>{{ entry.name }}</span>
            </span>
            <span class="flex flex-row items-center gap-2">
              <span class="text-right">
                @if (entry.gained) {
                  <span class="text-xs opacity-70">(+{{ entry.gained }})</span>
                }
                {{ entry.points }} point
              </span>
              <span class="w-16 text-right">
                <sha-position-change [change]="entry.change"/>
              </span>
            </span>
          </span>
        </mat-list-item>
      }
    </mat-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, NgOptimizedImage, PositionChangeComponent, TeamLogoComponent],
})
export class ChampionshipListComponent {
  entries = input.required<ChampionshipEntry[]>();

  protected readonly placeholder = 'assets/loading/yellow.svg';
  protected readonly failedImages = signal(new Set<string>());

  protected imageFailed(id: string) {
    this.failedImages.update(failed => new Set(failed).add(id));
  }
}
