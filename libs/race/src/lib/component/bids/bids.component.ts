import { Router, ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Bid } from '@f2020/data';

@Component({
  selector: 'f2020-bids',
  templateUrl: './bids.component.html',
  styleUrls: ['./bids.component.scss'],
  changeDetection:  ChangeDetectionStrategy.OnPush
})
export class BidsComponent {

  private _bids: Bid[];


  @Input() set bids(value: Bid[]) {
    this._bids = [...value || []].sort((a, b) => b.points - a.points)
  }

  get bids(): Bid[] {
    return this._bids;
  }

  constructor(private router: Router, private route: ActivatedRoute) {
  }

  gotoBid(uid: string) {
    this.router.navigate(['bid', uid], {relativeTo: this.route})
  }
}
