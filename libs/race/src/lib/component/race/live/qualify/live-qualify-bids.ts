import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatList, MatListItem, MatListItemAvatar, MatListItemLine, MatListItemTitle } from '@angular/material/list';
import { Bid, buildInterimResult, calculateInterimResult, ILiveQualifyResult, IRace } from '@f2020/data';
import { AnimatedForDirective } from '@f2020/shared';

@Component({
  selector: 'f2020-live-qualify-bids',
  template: `
    @if (ranked().length) {
      <mat-list>
        <mat-list-item *shaAnimatedFor="let bid of ranked(); key: playerKey">
          <img matListItemAvatar height="40" width="40" [ngSrc]="bid.player.photoURL" [alt]="bid.player.displayName">
          <div matListItemTitle>{{ bid.player.displayName }}</div>
          <div matListItemLine>{{ bid.points }} point</div>
        </mat-list-item>
      </mat-list>
    } @else {
      Venter på kvalifikationen...
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AnimatedForDirective, MatList, MatListItem, MatListItemAvatar, MatListItemTitle, MatListItemLine, NgOptimizedImage],
})
export class LiveQualifyBidsComponent {
  race = input.required<IRace>();
  bids = input.required<Bid[]>();
  result = input.required<ILiveQualifyResult | undefined>();

  /** The players ranked by the points they get from the qualifying as it is now */
  protected readonly ranked = computed(() => {
    const result = this.result();
    if (!result?.results.length) return [];
    const interimResult = buildInterimResult(result, this.race().selectedDriver, this.race().selectedTeam);
    return this.bids()
      .map(bid => calculateInterimResult(bid, interimResult))
      .toSorted((a, b) => b.points - a.points || a.player.displayName.localeCompare(b.player.displayName));
  });

  protected readonly playerKey = (bid: Bid) => bid.player.uid;
}
