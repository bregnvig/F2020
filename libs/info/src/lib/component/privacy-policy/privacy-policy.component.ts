import { ChangeDetectionStrategy, Component } from '@angular/core';
import { icon } from '@f2020/shared';

@Component({
  selector: 'info-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivacyPolicyComponent {
  icon = icon.farInfo;
}
