import { ChangeDetectionStrategy, Component, Input, numberAttribute } from '@angular/core';
import { IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'f2020-number-card',
    templateUrl: './number-card.component.html',
    styleUrls: ['./number-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatCardModule, FontAwesomeModule],
})
export class NumberCardComponent {
  @Input() title: string;
  @Input() icon: [IconPrefix, IconName];
  @Input({transform: numberAttribute}) number: number;
}
