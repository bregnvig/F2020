import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardPageComponent, icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  templateUrl: './missing-role.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, FaIconComponent, CardPageComponent],
})
export class MissingRoleComponent {
  icon = icon.falTireFlat;
}
