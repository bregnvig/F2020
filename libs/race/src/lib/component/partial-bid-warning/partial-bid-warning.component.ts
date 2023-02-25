import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Bid } from '@f2020/data';
import { icon } from '@f2020/shared';

@Component({
  selector: 'f2020-partial-bid-warning',
  template: `
    <fa-icon 
      *ngIf="!bid.submitted"
      class="focus-meta"
      [icon]="icon"
      size="2x"
      #tooltip="matTooltip"
      (click)="tooltip.toggle(); $event.preventDefault();"
      [matTooltip]="bid.player.displayName + ' har ikke indsendt sit bud'"
    ></fa-icon>
  `,
  styles: [
    `
      fa-icon {
        color: white;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartialBidWarningComponent {

  icon = icon.falTireFlat;

  @Input() bid: Partial<Bid>;

}
