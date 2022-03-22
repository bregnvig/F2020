import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Bid } from '@f2020/data';

@Component({
  selector: 'f2020-partial-bid-warning',
  template: `
    <i class="fal fa-tire-flat" 
      *ngIf="!bid.submitted"
      #tooltip="matTooltip"
      (click)="tooltip.toggle(); $event.preventDefault();"
      [matTooltip]="bid.player.displayName + ' har ikke indsendt sit bud'">
    </i>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartialBidWarningComponent {

  @Input() bid: Partial<Bid>;

}
