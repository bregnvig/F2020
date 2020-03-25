import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Bid } from './../../model/bid.model';

@Component({
  selector: 'f2020-bids',
  templateUrl: './bids.component.html',
  styleUrls: ['./bids.component.scss'],
  changeDetection:  ChangeDetectionStrategy.OnPush
})
export class BidsComponent {

  @Input() bids: Bid[];

}
