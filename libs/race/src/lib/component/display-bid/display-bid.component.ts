import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Bid, IRace } from '@f2020/data';

@Component({
  selector: 'f2020-display-bid',
  templateUrl: './display-bid.component.html',
  styleUrls: ['./display-bid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisplayBidComponent {

  @Input() bid: Partial<Bid>;
  @Input() race: IRace;
}
