import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { ActivatedRoute, Router } from '@angular/router';
import { Bid, Participant } from '@f2020/data';
import { icon, RelativeToNowPipe } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { PartialBidWarningComponent } from '../partial-bid-warning/partial-bid-warning.component';

const polePositionDiffComparator = (a: Partial<Bid>, b: Partial<Bid>): number => (a.polePositionTimeDiff ?? 0) - (b.polePositionTimeDiff ?? 0);

@Component({
  selector: 'f2020-bids',
  templateUrl: './bids.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, FaIconComponent, PartialBidWarningComponent, NgOptimizedImage, RelativeToNowPipe],
})
export class BidsComponent {

  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);

  readonly icon = icon.fasFlagCheckered;
  readonly disabled = input(false);
  readonly isBid = (bid: Bid | Participant): bid is Bid => (bid as Bid).points !== undefined;
  readonly result = input<Partial<Bid>>(undefined);

  readonly bids = input.required<Bid[] | Participant[], Bid[] | Participant[]>({
    transform: value => {
      return [...value || []].toSorted((a, b) => {
        if (this.isBid(a) && this.isBid(b)) {
          return (b.points - a.points) || (polePositionDiffComparator(a, b));
        }
        return a.player.displayName.localeCompare(b.player.displayName);
      });
    },
  });

  gotoBid(uid: string) {
    this.#router.navigate(['bid', uid], { relativeTo: this.#route });
  }

  gotoResult() {
    this.#router.navigate(['result'], { relativeTo: this.#route });
  }
}
