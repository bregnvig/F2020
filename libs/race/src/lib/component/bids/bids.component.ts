import { Router, ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Bid } from '@f2020/data';
import { icon } from '@f2020/shared';
import { PartialBidWarningComponent } from '../partial-bid-warning/partial-bid-warning.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgIf, NgFor } from '@angular/common';
import { MatListModule } from '@angular/material/list';

const polePositionDiffComparator = (a: Partial<Bid>, b: Partial<Bid>): number => (a.polePositionTimeDiff ?? 0) - (b.polePositionTimeDiff ?? 0);

@Component({
    selector: 'f2020-bids',
    templateUrl: './bids.component.html',
    styleUrls: ['./bids.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatListModule, NgIf, FontAwesomeModule, NgFor, PartialBidWarningComponent]
})
export class BidsComponent {

  private _bids: Bid[];
  icon = icon.fasFlagCheckered;


  @Input() result: Partial<Bid>;

  @Input() set bids(value: Bid[]) {
    this._bids = [...value || []].sort((a, b) => (b.points - a.points) || (polePositionDiffComparator(a, b)));
  }

  get bids(): Bid[] {
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
