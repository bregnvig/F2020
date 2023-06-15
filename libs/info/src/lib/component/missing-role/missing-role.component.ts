import { ChangeDetectionStrategy, Component } from '@angular/core';
import { icon } from '@f2020/shared';
import { CardPageComponent } from '@f2020/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
    templateUrl: './missing-role.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatToolbarModule, FontAwesomeModule, CardPageComponent]
})
export class MissingRoleComponent {
  icon = icon.falTireFlat;
}
