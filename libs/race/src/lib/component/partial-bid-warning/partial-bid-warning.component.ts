import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Bid, Participant } from '@f2020/data';
import { icon } from '@f2020/shared';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';


@Component({
  selector: 'f2020-partial-bid-warning',
  template: `
    @if (!bid.submitted) {
      <fa-icon
        class="focus-meta"
        [icon]="icon"
        size="2x"
        #tooltip="matTooltip"
        (click)="tooltip.toggle(); $event.preventDefault();"
        [matTooltip]="bid.player.displayName + ' har ikke indsendt sit bud'"
      ></fa-icon>
    }
    `,
  styles: [
    `
      fa-icon {
        color: white;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FontAwesomeModule, MatTooltipModule]
})
export class PartialBidWarningComponent {

  icon = icon.falTireFlat;

  @Input() bid: Participant;

}
