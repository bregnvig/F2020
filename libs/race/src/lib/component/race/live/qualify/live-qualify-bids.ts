import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { MatList, MatListItem, MatListItemAvatar, MatListItemLine, MatListItemTitle } from '@angular/material/list';
import { buildInterimResult } from '@f2020/api';
import { Bid, calculateInterimResult, ILiveQualifyResult, IRace } from '@f2020/data';
import { PositionChangeComponent } from '@f2020/shared';

@Component({
  selector: 'f2020-live-qualify-bids',
  template: `
    <mat-list>
      @for (entry of entries(); track entry.bid.player.uid) {
        <mat-list-item [style.transform]="'translateY(' + entry.offset * 100 + '%)'">
          <img matListItemAvatar height="40" width="40" [ngSrc]="entry.bid.player.photoURL" [alt]="entry.bid.player.displayName">
          <div matListItemTitle>
            <span class="inline-flex w-full flex-row justify-between items-center gap-2">
              <span>{{ entry.bid.player.displayName }}</span>
              <sha-position-change [change]="entry.change" />
            </span>
          </div>
          <div matListItemLine>{{ entry.bid.points }} point</div>
        </mat-list-item>
      } @empty {
        Venter på kvalifikationen...
      }
    </mat-list>
  `,
  styles: `
    mat-list-item {
      transition: all 1s;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatList, MatListItem, MatListItemAvatar, MatListItemTitle, MatListItemLine, NgOptimizedImage, PositionChangeComponent],
})
export class LiveQualifyBidsComponent {
  race = input.required<IRace>();
  bids = input.required<Bid[]>();
  result = input.required<ILiveQualifyResult | undefined>();

  /** The players ranked by the points they get from the qualifying as it is now */
  #ranked = computed(() => {
    const result = this.result();
    if (!result?.results.length) return [];
    const interimResult = buildInterimResult(result, this.race().selectedDriver, this.race().selectedTeam);
    return this.bids()
      .map(bid => calculateInterimResult(bid, interimResult))
      .toSorted((a, b) => b.points - a.points || a.player.displayName.localeCompare(b.player.displayName));
  });

  /** The order when the page was opened. The players stay in it and are moved to their place, so they slide up and down */
  #initial = linkedSignal<Bid[], string[]>({
    source: this.#ranked,
    computation: (ranked, previous) => previous?.value.length ? previous.value : ranked.map(bid => bid.player.uid),
  });

  protected readonly entries = computed(() => {
    const ranked = this.#ranked();
    const current = new Map(ranked.map((bid, index) => [bid.player.uid, { bid, index }]));
    return this.#initial()
      .filter(uid => current.has(uid))
      .map((uid, index) => {
        const { bid, index: currentIndex } = current.get(uid)!;
        return { bid, offset: currentIndex - index, change: index - currentIndex };
      });
  });
}
