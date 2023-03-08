import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'f2020-number-card',
  templateUrl: './number-card.component.html',
  styleUrls: ['./number-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberCardComponent {
  @Input() title: string;
  @Input() icon: [IconPrefix, IconName];
  @Input() number: string | number;
}
