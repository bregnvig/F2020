import { ChangeDetectionStrategy, Component } from '@angular/core';
import { icon } from '@f2020/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatCardModule } from '@angular/material/card';
import { CardPageComponent } from '@f2020/shared';

@Component({
    selector: 'info-privacy-policy',
    templateUrl: './privacy-policy.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CardPageComponent, MatCardModule, FontAwesomeModule]
})
export class PrivacyPolicyComponent {
  icon = icon.farInfo;
}
