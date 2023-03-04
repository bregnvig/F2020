import { ChangeDetectionStrategy, Component } from '@angular/core';
import { icon } from '@f2020/shared';

@Component({
  templateUrl: './missing-role.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MissingRoleComponent {
  icon = icon.falTireFlat;
}
