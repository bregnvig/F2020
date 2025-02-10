import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Participant } from '@f2020/data';
import { icon } from '@f2020/shared';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';


@Component({
  selector: 'f2020-partial-bid-warning',
  template: `
    @if (!bid().submitted) {
      <fa-icon
        class="focus-meta"
        [icon]="icon"
        size="2x"
        #tooltip="matTooltip"
        (click)="tooltip.toggle(); $event.preventDefault();"
        [matTooltip]="bid().player.displayName + ' har ikke indsendt sit bud'"
      />
    }
  `,
  styles: [
    `
      fa-icon {
        color: white;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FaIconComponent, MatTooltip],
})
export class PartialBidWarningComponent {

  icon = icon.falTireFlat;

  bid = input.required<Participant>();

}
