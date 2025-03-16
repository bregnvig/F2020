import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardPageComponent, icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'info-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardPageComponent, MatCardModule, FaIconComponent],
})
export class PrivacyPolicyComponent {
  icon = icon.farInfo;
}
