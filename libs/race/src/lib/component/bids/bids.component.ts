import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { ActivatedRoute, Router } from '@angular/router';
import { Bid, Participant } from '@f2020/data';
import { icon, RelativeToNowPipe } from '@f2020/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PartialBidWarningComponent } from '../partial-bid-warning/partial-bid-warning.component';

const polePositionDiffComparator = (a: Partial<Bid>, b: Partial<Bid>): number => (a.polePositionTimeDiff ?? 0) - (b.polePositionTimeDiff ?? 0);

@Component({
  selector: 'f2020-bids',
  templateUrl: './bids.component.html',
  styleUrls: ['./bids.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatListModule, FontAwesomeModule, PartialBidWarningComponent, NgOptimizedImage, RelativeToNowPipe],
})
export class BidsComponent {

  private _bids: Bid[] | Participant[] = [];
  icon = icon.fasFlagCheckered;
  @Input() clickable = false;
  isBid = (bid: Bid | Participant): bid is Bid => (bid as Bid).points !== undefined;


  @Input() result: Partial<Bid>;

  @Input({ required: true }) set bids(value: Bid[] | Participant[]) {
    this._bids = [...value || []].sort((a, b) => {
      if (this.isBid(a) && this.isBid(b)) {
        return (b.points - a.points) || (polePositionDiffComparator(a, b));
      }
      return a.player.displayName.localeCompare(b.player.displayName);
    });
  }

  get bids(): Bid[] | Participant[] {
    return this._bids;
  }

  constructor(private router: Router, private route: ActivatedRoute) {
  }

  gotoBid(uid: string) {
    this.router.navigate(['bid', uid], { relativeTo: this.route });
  }

  gotoResult() {
    this.router.navigate(['result'], { relativeTo: this.route });
  }
}
